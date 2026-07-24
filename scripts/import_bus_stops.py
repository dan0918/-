import argparse
import json
import os
from pathlib import Path

import requests
from nycu_tdx_py import tdx

BOUNDS = {
    "west": 121.2833333333,
    "east": 121.3305555556,
    "south": 24.95,
    "north": 25.0472222222,
}


def inside(lat, lng):
    return (
        BOUNDS["south"] <= lat <= BOUNDS["north"]
        and BOUNDS["west"] <= lng <= BOUNDS["east"]
    )


def get_access_token(args):
    token = os.environ.get("TDX_ACCESS_TOKEN")
    if token:
        return token

    client_id = args.client_id or os.environ.get("TDX_CLIENT_ID")
    client_secret = args.client_secret or os.environ.get("TDX_CLIENT_SECRET")
    if client_id and client_secret:
        token = tdx.get_token(client_id, client_secret)
        if token:
            return token
        raise SystemExit("TDX credentials were rejected. Check TDX_CLIENT_ID and TDX_CLIENT_SECRET.")

    raise SystemExit(
        "Missing TDX credentials. Set TDX_ACCESS_TOKEN or TDX_CLIENT_ID and TDX_CLIENT_SECRET, then rerun this script."
    )


def fetch_tdx_json(access_token, url):
    response = requests.get(
        url,
        params={"$format": "JSON"},
        headers={"authorization": "Bearer " + access_token},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def text_name(value):
    if isinstance(value, dict):
        return value.get("Zh_tw") or value.get("En") or ""
    return str(value or "")


def position_key(lat, lng):
    return f"{lat:.6f},{lng:.6f}"


def item_key(item):
    return "|".join(
        [
            str(item.get("id", "")),
            str(item.get("name", "")),
            str(item.get("routeName", "")),
            str(item.get("source", "")),
        ]
    )


def add_group(groups, lat, lng, item):
    if not inside(lat, lng):
        return

    layer_type = item["type"]
    key = f"{layer_type}:{position_key(lat, lng)}"
    if key not in groups:
        groups[key] = {
            "id": f"bus-{key.replace(',', '-')}",
            "type": layer_type,
            "name": item["name"],
            "address": "",
            "lat": lat,
            "lng": lng,
            "items": [],
            "_itemKeys": set(),
        }

    if item_key(item) not in groups[key]["_itemKeys"]:
        groups[key]["items"].append(item)
        groups[key]["_itemKeys"].add(item_key(item))


def add_taoyuan_city_stops(groups, access_token):
    frame = tdx.Bus_StopOfRoute(access_token, "Taoyuan", dtype="text")
    if frame is None:
        raise SystemExit("TDX Bus_StopOfRoute request failed. Check token validity and TDX API access.")

    for _, row in frame.iterrows():
        lat = float(row["PositionLat"])
        lng = float(row["PositionLon"])
        stop_id = str(row["StopUID"] or row["StopID"] or row["StationID"])
        add_group(
            groups,
            lat,
            lng,
            {
                "type": "city-bus",
                "id": stop_id,
                "name": str(row["StopName"]),
                "routeName": str(row["RouteName"]),
                "source": "市內公車",
            },
        )


def build_intercity_route_lookup(access_token):
    url = "https://tdx.transportdata.tw/api/basic/v2/Bus/StopOfRoute/InterCity"
    lookup = {}

    for route in fetch_tdx_json(access_token, url):
        route_name = text_name(route.get("RouteName"))
        for stop in route.get("Stops", []):
            stop_name = text_name(stop.get("StopName"))
            keys = [
                stop.get("StopUID"),
                stop.get("StopID"),
                stop.get("StationID"),
                f"name:{stop_name}",
            ]
            for key in keys:
                if not key:
                    continue
                lookup.setdefault(str(key), set()).add(route_name)

    return lookup


def intercity_routes_for(row, route_lookup):
    stop_name = text_name(row.get("StopName"))
    route_names = set()
    for key in [row.get("StopUID"), row.get("StopID"), row.get("StationID"), f"name:{stop_name}"]:
        if key and str(key) in route_lookup:
            route_names.update(route_lookup[str(key)])
    return sorted(name for name in route_names if name)


def add_intercity_stops(groups, access_token):
    stop_url = "https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/InterCity"
    route_lookup = build_intercity_route_lookup(access_token)

    for row in fetch_tdx_json(access_token, stop_url):
        position = row.get("StopPosition") or {}
        lat = float(position.get("PositionLat"))
        lng = float(position.get("PositionLon"))
        stop_name = text_name(row.get("StopName")) or str(row.get("StopID"))
        route_names = intercity_routes_for(row, route_lookup)
        add_group(
            groups,
            lat,
            lng,
            {
                "type": "intercity-bus",
                "id": str(row.get("StopUID") or row.get("StopID") or row.get("StationID")),
                "name": stop_name,
                "routeName": ", ".join(route_names),
                "source": "公路公車",
            },
        )


def finalize_groups(groups):
    output = []
    for group in groups.values():
        group.pop("_itemKeys", None)
        if len(group["items"]) > 1:
            group["name"] = f"{group['items'][0]['name']} 等 {len(group['items'])} 站牌"
        if group["items"]:
            sources = sorted({item.get("source", "") for item in group["items"] if item.get("source")})
            group["address"] = " / ".join(sources)
        output.append(group)
    return sorted(output, key=lambda item: (item["lat"], item["lng"], item["name"]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--client-id")
    parser.add_argument("--client-secret")
    args = parser.parse_args()

    root = Path.cwd()
    output_path = root / "src" / "data" / "bus-stops.json"
    access_token = get_access_token(args)
    groups = {}
    add_taoyuan_city_stops(groups, access_token)
    add_intercity_stops(groups, access_token)

    output_path.write_text(
        json.dumps(finalize_groups(groups), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(groups)} bus stop locations to {output_path}")


if __name__ == "__main__":
    main()

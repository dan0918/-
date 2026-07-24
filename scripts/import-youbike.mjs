import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "src", "data", "UBIKE.JSON");
const outputPath = path.join(root, "src", "data", "youbike-stations.json");
const bounds = {
  west: 121.2833333333,
  east: 121.3305555556,
  south: 24.95,
  north: 25.0472222222
};

function inside(lat, lng) {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const stations = (raw.retVal ?? [])
  .map((station) => {
    const lat = Number(station.lat);
    const lng = Number(station.lng);
    return {
      id: `youbike-${station.sno}`,
      type: "youbike",
      name: station.sna?.replace(/^YouBike2\.0_/, "") || station.snaen?.replace(/^YouBike2\.0_/, "") || station.sno,
      address: station.ar || station.aren || "",
      lat,
      lng
    };
  })
  .filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lng) && inside(station.lat, station.lng));

fs.writeFileSync(outputPath, `${JSON.stringify(stations, null, 2)}\n`, "utf8");
console.log(`Wrote ${stations.length} YouBike stations to ${outputPath}`);

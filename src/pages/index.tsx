import dynamic from "next/dynamic";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PopupCard } from "@/components/PopupCard";
import { Sidebar } from "@/components/Sidebar";
import { isInsideMapBounds, mapCenter } from "@/data/mapBounds";
import busStops from "@/data/bus-stops.json";
import communitiesData from "@/data/communities.json";
import convenienceStores from "@/data/convenience-stores.json";
import schools from "@/data/schools.json";
import youbikeStations from "@/data/youbike-stations.json";
import type { Amenity, Community, LayerKey, MapQueryBounds, NearbyTransitResult } from "@/types/community";

const CommunityMap = dynamic(() => import("@/components/Map").then((mod) => mod.CommunityMap), {
  ssr: false,
  loading: () => <MapLoading />
});

type SavedCommunityNote = {
  id: string;
  communityId: string;
  communityName: string;
  address: string;
  note: string;
  score: number;
  savedAt: string;
};

const defaultLayers: Record<LayerKey, boolean> = {
  youbike: false,
  "city-bus": false,
  "intercity-bus": false,
  school: false,
  "convenience-store": false
};

const layerKeys = Object.keys(defaultLayers) as LayerKey[];

function MapLoading() {
  return <div className="grid h-full place-items-center text-sm text-muted-foreground">地圖載入中...</div>;
}

function isAmenityInsideBounds(amenity: Amenity, bounds: MapQueryBounds) {
  return amenity.lat >= bounds.south && amenity.lat <= bounds.north && amenity.lng >= bounds.west && amenity.lng <= bounds.east;
}

function routeNamesFromStop(stop: Amenity) {
  return (stop.items ?? [])
    .flatMap((item) => (item.routeName ?? "").split(","))
    .map((route) => route.trim())
    .filter(Boolean);
}

function uniqueSortedRoutes(stops: Amenity[]) {
  return Array.from(new Set(stops.flatMap(routeNamesFromStop))).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function stopHasRoute(stop: Amenity, routeName: string) {
  return routeNamesFromStop(stop).includes(routeName);
}

function findNearestStopToBoundsCenter(stops: Amenity[], bounds?: MapQueryBounds) {
  if (!bounds) return stops[0];
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;

  return stops.reduce((nearest, stop) => {
    const nearestDistance = (nearest.lat - centerLat) ** 2 + (nearest.lng - centerLng) ** 2;
    const stopDistance = (stop.lat - centerLat) ** 2 + (stop.lng - centerLng) ** 2;
    return stopDistance < nearestDistance ? stop : nearest;
  }, stops[0]);
}

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [communities, setCommunities] = useState<Community[]>(communitiesData.communities as Community[]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [enabledLayers, setEnabledLayers] = useState<Record<LayerKey, boolean>>(defaultLayers);
  const [fitSignal, setFitSignal] = useState(0);
  const [queryBounds, setQueryBounds] = useState<MapQueryBounds>();
  const [viewportBounds, setViewportBounds] = useState<MapQueryBounds>();
  const [nearbyTransit, setNearbyTransit] = useState<NearbyTransitResult>();
  const [nearbyTransitMarkersVisible, setNearbyTransitMarkersVisible] = useState(false);
  const [selectedAmenityId, setSelectedAmenityId] = useState<string>();
  const [selectedRouteAmenityIds, setSelectedRouteAmenityIds] = useState<string[]>([]);
  const [selectedRouteLayer, setSelectedRouteLayer] = useState<LayerKey>();
  const [selectedRoutePopupAmenityId, setSelectedRoutePopupAmenityId] = useState<string>();
  const [scopedQueryBounds, setScopedQueryBounds] = useState<MapQueryBounds>();
  const [noteHistory, setNoteHistory] = useState<SavedCommunityNote[]>([]);
  const [routeFocusSignal, setRouteFocusSignal] = useState(0);
  const [amenityFocusSignal, setAmenityFocusSignal] = useState(0);
  const didAutoSearchNearbyTransit = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const loadCommunities = async () => {
      const response = await fetch("/api/communities");
      if (!response.ok) return;
      const data = (await response.json()) as { communities?: Community[] };
      if (data.communities?.length) setCommunities(data.communities);
    };

    loadCommunities().catch(() => undefined);
  }, []);

  useEffect(() => {
    const loadSavedNotes = async () => {
      const response = await fetch("/api/community-notes");
      if (!response.ok) return;
      const data = (await response.json()) as { entries?: SavedCommunityNote[]; latest?: SavedCommunityNote[] };
      setNoteHistory(data.entries ?? []);
      if (!data.latest?.length) return;

      setCommunities((current) =>
        current.map((community) => {
          const saved = data.latest?.find((item) => item.communityId === community.id);
          return saved ? { ...community, note: saved.note, score: saved.score } : community;
        })
      );
    };

    loadSavedNotes().catch(() => undefined);
  }, []);

  const boundedCommunities = useMemo(
    () => communities.filter((community) => isInsideMapBounds(community.lat, community.lng)),
    [communities]
  );

  const selectedCommunity = boundedCommunities.find((community) => community.id === selectedId);
  const selectedCommunityNoteHistory = useMemo(
    () =>
      selectedCommunity
        ? noteHistory
            .filter((entry) => entry.communityId === selectedCommunity.id)
            .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        : [],
    [noteHistory, selectedCommunity]
  );

  const updateCommunity = useCallback((updated: Community) => {
    setCommunities((current) => current.map((community) => (community.id === updated.id ? updated : community)));
  }, []);

  const persistCommunities = useCallback(async (nextCommunities: Community[]) => {
    const response = await fetch("/api/communities", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ communities: nextCommunities })
    });

    if (!response.ok) throw new Error("Failed to save communities");
  }, []);

  const saveEditedCommunity = useCallback(
    async (updated: Community) => {
      const nextCommunities = communities.map((community) => (community.id === updated.id ? updated : community));
      await persistCommunities(nextCommunities);
      setCommunities(nextCommunities);
      setSelectedId(updated.id);
    },
    [communities, persistCommunities]
  );

  const addCommunity = useCallback(async () => {
    const createdAt = Date.now();
    const newCommunity: Community = {
      id: `community-${createdAt}`,
      name: "新增物件",
      address: "請輸入地址",
      station: "",
      lat: mapCenter[0],
      lng: mapCenter[1],
      pricePerPing: "未填",
      age: "未填",
      sourceUrl: "",
      note: "",
      score: 0
    };

    const nextCommunities = [...communities, newCommunity];
    await persistCommunities(nextCommunities);
    setCommunities(nextCommunities);
    setSelectedId(newCommunity.id);
  }, [communities, persistCommunities]);

  const deleteCommunity = useCallback(async (communityToDelete: Community) => {
    const nextCommunities = communities.filter((community) => community.id !== communityToDelete.id);
    await persistCommunities(nextCommunities);
    const noteResponse = await fetch(`/api/community-notes?communityId=${encodeURIComponent(communityToDelete.id)}`, {
      method: "DELETE"
    });
    if (!noteResponse.ok) throw new Error("Failed to delete community notes");

    setCommunities(nextCommunities);
    setNoteHistory((current) => current.filter((entry) => entry.communityId !== communityToDelete.id));
    setSelectedId(undefined);
  }, [communities, persistCommunities]);

  const saveCommunityNote = useCallback(async (community: Community) => {
    const response = await fetch("/api/community-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        communityId: community.id,
        communityName: community.name,
        address: community.address,
        note: community.note,
        score: community.score
      })
    });

    if (!response.ok) throw new Error("Failed to save community note");
    const data = (await response.json()) as { entry?: SavedCommunityNote };
    if (data.entry) setNoteHistory((current) => [...current, data.entry as SavedCommunityNote].sort((a, b) => a.savedAt.localeCompare(b.savedAt)));
  }, []);

  const clearScopedAmenities = useCallback(() => {
    setSelectedAmenityId(undefined);
    setSelectedRouteAmenityIds([]);
    setSelectedRouteLayer(undefined);
    setSelectedRoutePopupAmenityId(undefined);
    setScopedQueryBounds(undefined);
    setNearbyTransitMarkersVisible(false);
  }, []);

  const clearCollapsedMapLayers = useCallback(() => {
    clearScopedAmenities();
    setEnabledLayers(defaultLayers);
  }, [clearScopedAmenities]);

  const toggleAllLayers = useCallback(() => {
    clearScopedAmenities();
    setEnabledLayers((current) => {
      const allEnabled = layerKeys.every((key) => current[key]);
      return layerKeys.reduce(
        (next, key) => ({
          ...next,
          [key]: !allEnabled
        }),
        {} as Record<LayerKey, boolean>
      );
    });
  }, [clearScopedAmenities]);

  const amenities = useMemo<Amenity[]>(
    () =>
      [
        ...(youbikeStations as Amenity[]),
        ...(busStops as Amenity[]),
        ...(schools as Amenity[]),
        ...(convenienceStores as Amenity[])
      ].filter((amenity) => isInsideMapBounds(amenity.lat, amenity.lng)),
    []
  );

  const focusAmenity = useCallback((amenity: Amenity) => {
    const scopedAmenityIds =
      amenity.type === "youbike" && nearbyTransit?.youbikeStations.length
        ? nearbyTransit.youbikeStations.map((station) => station.id)
        : [amenity.id];

    setSelectedAmenityId(undefined);
    setSelectedRouteLayer(amenity.type);
    setSelectedRouteAmenityIds(scopedAmenityIds);
    setSelectedRoutePopupAmenityId(amenity.id);
    setRouteFocusSignal((value) => value + 1);
  }, [nearbyTransit]);

  const searchNearbyTransit = useCallback((showQueryBounds = true) => {
    clearScopedAmenities();
    if (!queryBounds) {
      setNearbyTransit({ youbikeStations: [], busStops: [], cityBusRoutes: [], intercityBusRoutes: [] });
      return;
    }

    const nearby = amenities.filter((amenity) => isAmenityInsideBounds(amenity, queryBounds));
    const youbikeStationsNearby = nearby.filter((amenity) => amenity.type === "youbike");
    const cityBusStopsNearby = nearby.filter((amenity) => amenity.type === "city-bus");
    const intercityBusStopsNearby = nearby.filter((amenity) => amenity.type === "intercity-bus");
    const busStopsNearby = [...cityBusStopsNearby, ...intercityBusStopsNearby];

    if (showQueryBounds) setScopedQueryBounds(queryBounds);

    setNearbyTransit({
      bounds: queryBounds,
      youbikeStations: youbikeStationsNearby,
      busStops: busStopsNearby,
      cityBusRoutes: uniqueSortedRoutes(cityBusStopsNearby),
      intercityBusRoutes: uniqueSortedRoutes(intercityBusStopsNearby)
    });
    setNearbyTransitMarkersVisible(false);
  }, [amenities, clearScopedAmenities, queryBounds]);

  const toggleNearbyTransitMarkers = useCallback(() => {
    if (nearbyTransitMarkersVisible) {
      setSelectedAmenityId(undefined);
      setSelectedRouteLayer(undefined);
      setSelectedRouteAmenityIds([]);
      setSelectedRoutePopupAmenityId(undefined);
      setScopedQueryBounds(undefined);
      setNearbyTransitMarkersVisible(false);
      return;
    }

    const transitAmenityIds = [...(nearbyTransit?.youbikeStations ?? []), ...(nearbyTransit?.busStops ?? [])].map((amenity) => amenity.id);
    if (!transitAmenityIds.length) return;

    setSelectedAmenityId(undefined);
    setSelectedRouteLayer(undefined);
    setSelectedRouteAmenityIds(transitAmenityIds);
    setSelectedRoutePopupAmenityId(undefined);
    setScopedQueryBounds(nearbyTransit?.bounds ?? queryBounds);
    setNearbyTransitMarkersVisible(true);
  }, [nearbyTransit, nearbyTransitMarkersVisible, queryBounds]);

  const showQueryBoundsAmenities = useCallback(() => {
    const bounds = viewportBounds ?? queryBounds;
    if (!bounds) return;

    const amenityIds = amenities.filter((amenity) => isAmenityInsideBounds(amenity, bounds)).map((amenity) => amenity.id);
    setSelectedAmenityId(undefined);
    setSelectedRouteLayer(undefined);
    setSelectedRouteAmenityIds(amenityIds);
    setSelectedRoutePopupAmenityId(undefined);
    setScopedQueryBounds(bounds);
  }, [amenities, queryBounds, viewportBounds]);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  useEffect(() => {
    if (didAutoSearchNearbyTransit.current || !queryBounds) return;
    didAutoSearchNearbyTransit.current = true;
    searchNearbyTransit(false);
  }, [queryBounds, searchNearbyTransit]);

  const focusRoute = useCallback(
    (layer: "city-bus" | "intercity-bus", routeName: string) => {
      const stops = nearbyTransit?.busStops.filter((busStop) => busStop.type === layer && stopHasRoute(busStop, routeName)) ?? [];
      if (!stops.length) return;

      const nearestStop = findNearestStopToBoundsCenter(stops, nearbyTransit?.bounds);
      setSelectedAmenityId(undefined);
      setSelectedRouteLayer(layer);
      setSelectedRouteAmenityIds(stops.map((stop) => stop.id));
      setSelectedRoutePopupAmenityId(nearestStop.id);
      setRouteFocusSignal((value) => value + 1);
    },
    [nearbyTransit]
  );

  return (
    <>
      <Head>
        <title>找房速查</title>
        <meta name="description" content="買房看房筆記與生活機能地圖" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f766e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="找房速查" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/app-icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/app-icon-192.png" />
      </Head>
      <main className="relative h-screen overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          communities={boundedCommunities}
          selectedId={selectedId}
          enabledLayers={enabledLayers}
          nearbyTransit={nearbyTransit}
          nearbyTransitMarkersVisible={nearbyTransitMarkersVisible}
          onToggleCollapsed={toggleSidebarCollapsed}
          onShowQueryBoundsAmenities={showQueryBoundsAmenities}
          onClearCollapsedMapLayers={clearCollapsedMapLayers}
          onSelectCommunity={setSelectedId}
          onAddCommunity={addCommunity}
          onFitAll={() => setFitSignal((value) => value + 1)}
          onClearScopedAmenities={clearScopedAmenities}
          onToggleLayer={(layer) => {
            clearScopedAmenities();
            setEnabledLayers((current) => ({ ...current, [layer]: !current[layer] }));
          }}
          onToggleAllLayers={toggleAllLayers}
          onSearchNearbyTransit={() => searchNearbyTransit(true)}
          onToggleNearbyTransitMarkers={toggleNearbyTransitMarkers}
          onFocusAmenity={focusAmenity}
          onFocusRoute={focusRoute}
        />
        <section className="absolute inset-0 z-0 min-h-0">
          {isClient ? (
            <CommunityMap
              communities={boundedCommunities}
              amenities={amenities}
              selectedId={selectedId}
              selectedAmenityId={selectedAmenityId}
              selectedRouteAmenityIds={selectedRouteAmenityIds}
              selectedRouteLayer={selectedRouteLayer}
              selectedRoutePopupAmenityId={selectedRoutePopupAmenityId}
              scopedQueryBounds={scopedQueryBounds}
              amenityFocusSignal={amenityFocusSignal}
              routeFocusSignal={routeFocusSignal}
              enabledLayers={enabledLayers}
              sidebarCollapsed={sidebarCollapsed}
              onSelectCommunity={setSelectedId}
              onQueryBoundsChange={setQueryBounds}
              onViewportBoundsChange={setViewportBounds}
              fitSignal={fitSignal}
            />
          ) : (
            <MapLoading />
          )}
          <PopupCard
            community={selectedCommunity}
            history={selectedCommunityNoteHistory}
            onClose={() => setSelectedId(undefined)}
            onChange={updateCommunity}
            onSave={saveCommunityNote}
            onSaveEdit={saveEditedCommunity}
            onDelete={deleteCommunity}
          />
        </section>
      </main>
    </>
  );
}

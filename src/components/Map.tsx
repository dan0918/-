"use client";

import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import { layerOptions } from "@/components/Layers";
import { leafletMaxBounds, mapCenter } from "@/data/mapBounds";
import type { Amenity, Community, LayerKey, MapQueryBounds } from "@/types/community";

type CommunityMapProps = {
  communities: Community[];
  amenities: Amenity[];
  selectedId?: string;
  selectedAmenityId?: string;
  selectedRouteAmenityIds: string[];
  selectedRouteLayer?: LayerKey;
  selectedRoutePopupAmenityId?: string;
  scopedQueryBounds?: MapQueryBounds;
  amenityFocusSignal: number;
  routeFocusSignal: number;
  enabledLayers: Record<LayerKey, boolean>;
  onSelectCommunity: (id: string) => void;
  onQueryBoundsChange: (bounds: MapQueryBounds) => void;
  fitSignal: number;
};

const markerColors: Record<LayerKey | "house", string> = {
  house: "#6b7280",
  youbike: "#facc15",
  "city-bus": "#2563eb",
  "intercity-bus": "#16a34a",
  school: "#f97316",
  "convenience-store": "#ef4444"
};

function circleIcon(className: string, size = 30, color?: string) {
  const style = color ? ` style="background-color:${color}"` : "";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    html: `<div class="${className}"${style}></div>`
  });
}

export function CommunityMap({
  communities,
  amenities,
  selectedId,
  selectedAmenityId,
  selectedRouteAmenityIds,
  selectedRouteLayer,
  selectedRoutePopupAmenityId,
  scopedQueryBounds,
  amenityFocusSignal,
  routeFocusSignal,
  enabledLayers,
  onSelectCommunity,
  onQueryBoundsChange,
  fitSignal
}: CommunityMapProps) {
  return (
    <MapContainer
      center={mapCenter}
      zoom={14}
      minZoom={13}
      maxBounds={leafletMaxBounds}
      maxBoundsViscosity={1}
      zoomControl={false}
      className="z-0 h-full w-full"
    >
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapControls fitSignal={fitSignal} />
      <InvalidateSizeOnResize />
      <ClosePopupsOnManualMove />
      <QueryBoundsReporter onQueryBoundsChange={onQueryBoundsChange} />
      <QueryBoundsMask bounds={scopedQueryBounds} />
      <CommunityClusterLayer communities={communities} selectedId={selectedId} onSelectCommunity={onSelectCommunity} />
      <AmenityLayers
        amenities={amenities}
        selectedAmenityId={selectedAmenityId}
        selectedRouteAmenityIds={selectedRouteAmenityIds}
        selectedRouteLayer={selectedRouteLayer}
        selectedRoutePopupAmenityId={selectedRoutePopupAmenityId}
        amenityFocusSignal={amenityFocusSignal}
        routeFocusSignal={routeFocusSignal}
        enabledLayers={enabledLayers}
      />
    </MapContainer>
  );
}

function QueryBoundsMask({ bounds }: { bounds?: MapQueryBounds }) {
  const map = useMap();
  const [visibleBounds, setVisibleBounds] = useState<MapQueryBounds>();

  const queryBoundsOutline = useMemo(() => {
    if (!bounds || !visibleBounds) return undefined;

    const west = Math.max(visibleBounds.west, bounds.west);
    const east = Math.min(visibleBounds.east, bounds.east);
    const south = Math.max(visibleBounds.south, bounds.south);
    const north = Math.min(visibleBounds.north, bounds.north);

    if (west >= east || south >= north) return undefined;
    return [
      [south, west],
      [north, west],
      [north, east],
      [south, east]
    ] as L.LatLngExpression[];
  }, [bounds, visibleBounds]);

  useEffect(() => {
    if (!bounds) {
      setVisibleBounds(undefined);
      return;
    }

    const updateVisibleBounds = () => {
      const current = map.getBounds();
      setVisibleBounds({
        north: current.getNorth(),
        south: current.getSouth(),
        west: current.getWest(),
        east: current.getEast()
      });
    };

    updateVisibleBounds();
    map.on("moveend zoomend resize", updateVisibleBounds);
    window.addEventListener("resize", updateVisibleBounds);

    return () => {
      map.off("moveend zoomend resize", updateVisibleBounds);
      window.removeEventListener("resize", updateVisibleBounds);
    };
  }, [bounds, map]);

  const maskPolygons = useMemo(() => {
    if (!bounds || !visibleBounds) return [];

    const west = Math.max(visibleBounds.west, bounds.west);
    const east = Math.min(visibleBounds.east, bounds.east);
    const south = Math.max(visibleBounds.south, bounds.south);
    const north = Math.min(visibleBounds.north, bounds.north);

    if (west >= east || south >= north) return [];

    return [
      [
        [visibleBounds.south, visibleBounds.west],
        [south, visibleBounds.west],
        [south, visibleBounds.east],
        [visibleBounds.south, visibleBounds.east]
      ],
      [
        [north, visibleBounds.west],
        [visibleBounds.north, visibleBounds.west],
        [visibleBounds.north, visibleBounds.east],
        [north, visibleBounds.east]
      ],
      [
        [south, visibleBounds.west],
        [north, visibleBounds.west],
        [north, west],
        [south, west]
      ],
      [
        [south, east],
        [north, east],
        [north, visibleBounds.east],
        [south, visibleBounds.east]
      ]
    ] as L.LatLngExpression[][];
  }, [bounds, visibleBounds]);

  if (!maskPolygons.length) return null;

  return (
    <>
      {maskPolygons.map((positions, index) => (
        <Polygon
          key={`query-mask-${index}`}
          positions={positions}
          pathOptions={{
            color: "#000000",
            fillColor: "#000000",
            fillOpacity: 0.1,
            opacity: 0,
            interactive: false
          }}
        />
      ))}
      {queryBoundsOutline ? (
        <Polygon
          positions={queryBoundsOutline}
          pathOptions={{
            color: "#ef4444",
            dashArray: "7 6",
            fillOpacity: 0,
            interactive: false,
            opacity: 1,
            weight: 2
          }}
        />
      ) : null}
    </>
  );
}

function InvalidateSizeOnResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
      });
    };
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(invalidate) : null;

    invalidate();
    resizeObserver?.observe(container);
    window.addEventListener("resize", invalidate);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  return null;
}

function ClosePopupsOnManualMove() {
  const map = useMap();

  useEffect(() => {
    const closePopup = () => {
      map.closePopup();
    };

    map.on("dragstart zoomstart", closePopup);
    return () => {
      map.off("dragstart zoomstart", closePopup);
    };
  }, [map]);

  return null;
}

function MapControls({ fitSignal }: { fitSignal: number }) {
  const map = useMap();

  useEffect(() => {
    L.control.zoom({ position: "bottomleft" }).addTo(map);
  }, [map]);

  useEffect(() => {
    if (fitSignal === 0) return;
    map.fitBounds(leafletMaxBounds, { padding: [18, 18] });
  }, [fitSignal, map]);

  return null;
}

function QueryBoundsReporter({ onQueryBoundsChange }: { onQueryBoundsChange: (bounds: MapQueryBounds) => void }) {
  const map = useMap();

  useEffect(() => {
    const reportBounds = () => {
      const size = map.getSize();
      const margin = Math.max(0, Math.min(window.innerHeight * 0.1, size.x / 2 - 1, size.y / 2 - 1));
      const northwest = map.containerPointToLatLng([margin, margin]);
      const southeast = map.containerPointToLatLng([size.x - margin, size.y - margin]);

      onQueryBoundsChange({
        north: northwest.lat,
        south: southeast.lat,
        west: northwest.lng,
        east: southeast.lng
      });
    };

    reportBounds();
    map.on("moveend zoomend resize", reportBounds);
    window.addEventListener("resize", reportBounds);
    return () => {
      map.off("moveend zoomend resize", reportBounds);
      window.removeEventListener("resize", reportBounds);
    };
  }, [map, onQueryBoundsChange]);

  return null;
}

function CommunityClusterLayer({
  communities,
  selectedId,
  onSelectCommunity
}: {
  communities: Community[];
  selectedId?: string;
  onSelectCommunity: (id: string) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const lastSelectedIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 42,
      spiderfyOnMaxZoom: true
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.clearLayers();

    communities.forEach((community) => {
      const marker = L.marker([community.lat, community.lng], {
        icon: circleIcon("map-circle-marker house-marker", 34, markerColors.house)
      });
      marker.on("click", () => onSelectCommunity(community.id));
      marker.bindTooltip(`<span>${community.name}</span>`, {
        permanent: map.getZoom() >= 14,
        direction: "top",
        className: "community-label",
        opacity: 1
      });
      cluster.addLayer(marker);
    });
  }, [communities, map, onSelectCommunity]);

  useEffect(() => {
    if (!selectedId || selectedId === lastSelectedIdRef.current) return;
    lastSelectedIdRef.current = selectedId;

    const selected = communities.find((community) => community.id === selectedId);
    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
  }, [communities, map, selectedId]);

  useEffect(() => {
    const refreshLabels = () => {
      const cluster = clusterRef.current;
      if (!cluster) return;
      cluster.eachLayer((layer) => {
        const marker = layer as L.Marker;
        const tooltip = marker.getTooltip();
        if (!tooltip) return;
        if (map.getZoom() >= 14) {
          marker.openTooltip();
        } else {
          marker.closeTooltip();
        }
      });
    };
    map.on("zoomend", refreshLabels);
    refreshLabels();
    return () => {
      map.off("zoomend", refreshLabels);
    };
  }, [map]);

  return null;
}

function AmenityLayers({
  amenities,
  selectedAmenityId,
  selectedRouteAmenityIds,
  selectedRouteLayer,
  selectedRoutePopupAmenityId,
  amenityFocusSignal,
  routeFocusSignal,
  enabledLayers
}: {
  amenities: Amenity[];
  selectedAmenityId?: string;
  selectedRouteAmenityIds: string[];
  selectedRouteLayer?: LayerKey;
  selectedRoutePopupAmenityId?: string;
  amenityFocusSignal: number;
  routeFocusSignal: number;
  enabledLayers: Record<LayerKey, boolean>;
}) {
  const map = useMap();
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const lastFocusSignalRef = useRef(0);
  const lastRouteFocusSignalRef = useRef(0);
  const activeAmenities = useMemo(() => {
    const selectedRouteIds = new Set(selectedRouteAmenityIds);

    return amenities.filter((amenity) => {
      const isSelectedRouteStop = selectedRouteIds.has(amenity.id);
      if (selectedRouteLayer && amenity.type === selectedRouteLayer) return isSelectedRouteStop;
      return enabledLayers[amenity.type] || isSelectedRouteStop;
    });
  }, [amenities, enabledLayers, selectedRouteAmenityIds, selectedRouteLayer]);

  const closeAmenityPopups = () => {
    Object.values(markerRefs.current).forEach((marker) => {
      marker?.closePopup();
    });
  };

  useEffect(() => {
    if (!selectedAmenityId && !selectedRouteAmenityIds.length) {
      closeAmenityPopups();
    }
  }, [selectedAmenityId, selectedRouteAmenityIds]);

  useEffect(() => {
    if (!selectedAmenityId || amenityFocusSignal === lastFocusSignalRef.current) return;
    lastFocusSignalRef.current = amenityFocusSignal;

    const selected = amenities.find((amenity) => amenity.id === selectedAmenityId);
    if (!selected) return;

    closeAmenityPopups();
    map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 16), { duration: 0.5 });
    window.setTimeout(() => {
      markerRefs.current[selectedAmenityId]?.openPopup();
    }, 550);
  }, [amenities, amenityFocusSignal, map, selectedAmenityId]);

  useEffect(() => {
    if (!selectedRouteAmenityIds.length || routeFocusSignal === lastRouteFocusSignalRef.current) return;
    lastRouteFocusSignalRef.current = routeFocusSignal;

    const selectedStops = amenities.filter((amenity) => selectedRouteAmenityIds.includes(amenity.id));
    if (!selectedStops.length) return;

    closeAmenityPopups();
    if (selectedStops.length === 1) {
      map.flyTo([selectedStops[0].lat, selectedStops[0].lng], Math.max(map.getZoom(), 16), { duration: 0.5 });
    } else {
      const bounds = L.latLngBounds(selectedStops.map((stop) => [stop.lat, stop.lng] as L.LatLngTuple));
      map.fitBounds(bounds, { maxZoom: 16, padding: [42, 42] });
    }
    window.setTimeout(() => {
      if (selectedRoutePopupAmenityId) markerRefs.current[selectedRoutePopupAmenityId]?.openPopup();
    }, 550);
  }, [amenities, map, routeFocusSignal, selectedRouteAmenityIds, selectedRoutePopupAmenityId]);

  return (
    <>
      {activeAmenities.map((amenity) => (
        <Marker
          key={amenity.id}
          ref={(marker) => {
            markerRefs.current[amenity.id] = marker;
          }}
          position={[amenity.lat, amenity.lng]}
          icon={circleIcon(`map-circle-marker poi-marker-${amenity.type}`, 28, markerColors[amenity.type])}
        >
          <Popup closeButton className="map-popup" maxWidth={320}>
            <AmenityPopup amenity={amenity} />
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function AmenityPopup({ amenity }: { amenity: Amenity }) {
  return (
    <div className="space-y-2 text-sm">
      <strong className="block">
        {layerOptions.find((layer) => layer.key === amenity.type)?.label} / {amenity.name}
      </strong>
      {amenity.address ? <div className="text-muted-foreground">{amenity.address}</div> : null}
      <a
        className="block text-primary underline-offset-2 hover:underline"
        href={`https://www.google.com/maps/search/?api=1&query=${amenity.lat},${amenity.lng}`}
        target="_blank"
        rel="noreferrer"
      >
        Google Maps 查詢此座標
      </a>
      {amenity.items?.length ? (
        <ul className="m-0 max-h-56 list-none space-y-1 overflow-auto p-0">
          {amenity.items.map((item) => (
            <li key={`${amenity.id}-${item.id}-${item.routeName ?? ""}-${item.source ?? ""}`} className="border-t border-border pt-1">
              {item.name}
              {item.routeName ? ` / ${item.routeName}` : ""}
              {item.source ? ` / ${item.source}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

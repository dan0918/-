import { Bike, Building2, Bus, ChevronDown, LayersIcon, LocateFixed, PanelLeftClose, Star } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Layers } from "@/components/Layers";
import { SearchBox } from "@/components/SearchBox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Amenity, Community, LayerKey, NearbyTransitResult } from "@/types/community";

const listPreviewLimit = 12;

type BusRouteLayer = "city-bus" | "intercity-bus";

type SidebarProps = {
  collapsed: boolean;
  communities: Community[];
  selectedId?: string;
  enabledLayers: Record<LayerKey, boolean>;
  nearbyTransit?: NearbyTransitResult;
  nearbyTransitMarkersVisible: boolean;
  onToggleCollapsed: () => void;
  onShowQueryBoundsAmenities: () => void;
  onClearScopedAmenities: () => void;
  onClearCollapsedMapLayers: () => void;
  onSelectCommunity: (id: string) => void;
  onAddCommunity: () => void;
  onFitAll: () => void;
  onToggleLayer: (layer: LayerKey) => void;
  onToggleAllLayers: () => void;
  onSearchNearbyTransit: () => void;
  onToggleNearbyTransitMarkers: () => void;
  onFocusAmenity: (amenity: Amenity) => void;
  onFocusRoute: (layer: BusRouteLayer, routeName: string) => void;
};

export function Sidebar({
  collapsed,
  communities,
  selectedId,
  enabledLayers,
  nearbyTransit,
  nearbyTransitMarkersVisible,
  onToggleCollapsed,
  onShowQueryBoundsAmenities,
  onClearScopedAmenities,
  onClearCollapsedMapLayers,
  onSelectCommunity,
  onAddCommunity,
  onFitAll,
  onToggleLayer,
  onToggleAllLayers,
  onSearchNearbyTransit,
  onToggleNearbyTransitMarkers,
  onFocusAmenity,
  onFocusRoute
}: SidebarProps) {
  const [openSections, setOpenSections] = useState({
    traffic: false,
    layers: false,
    properties: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  if (collapsed) {
    return (
      <aside className="pointer-events-none fixed inset-0 z-[1000] bg-transparent">
        <div
          className="shadow-md"
          style={{
            background: "rgba(254, 253, 251, 0.95)",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            left: 12,
            padding: 8,
            pointerEvents: "auto",
            position: "fixed",
            top: 12,
            width: 108,
            zIndex: 1000
          }}
        >
          <Button
            type="button"
            size="default"
            className="rounded-md"
            style={{ fontSize: 10, height: 28, lineHeight: "12px", padding: "0 8px", whiteSpace: "nowrap", width: 92 }}
            onClick={onToggleCollapsed}
            aria-label="展開功能列"
          >
            展開功能
          </Button>
          <div style={{ color: "hsl(var(--foreground))", fontSize: 10, lineHeight: "14px", marginTop: 8 }}>
            <CollapsedLegend color="#facc15" label="YouBike" />
            <CollapsedLegend color="#2563eb" label="市內公車" />
            <CollapsedLegend color="#16a34a" label="公路公車" />
            <CollapsedLegend color="#f97316" label="學校" />
            <CollapsedLegend color="#ef4444" label="超商" />
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-start", marginTop: 8 }}>
            <Button
              type="button"
              size="default"
              variant="ghost"
              className="rounded-md"
              style={{ background: "transparent", border: "1px solid #9ca3af", fontSize: 9, height: 22, lineHeight: "10px", padding: "0 7px", whiteSpace: "nowrap" }}
              onClick={onShowQueryBoundsAmenities}
              aria-label="查詢"
            >
              查詢
            </Button>
            <Button
              type="button"
              size="default"
              variant="ghost"
              className="rounded-md"
              style={{ background: "transparent", border: "1px solid #9ca3af", fontSize: 9, height: 22, lineHeight: "10px", padding: "0 7px", whiteSpace: "nowrap" }}
              onClick={onClearCollapsedMapLayers}
              aria-label="清除"
            >
              清除
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="sidebar-panel fixed left-0 top-0 z-[1000] flex h-[100dvh] min-h-0 flex-col gap-3 overflow-y-auto overflow-x-hidden overscroll-contain border-r border-border bg-card p-3 text-xs shadow-2xl sm:p-4"
      style={{
        maxWidth: "33.333vw",
        width: "min(380px, 33.333vw)"
      }}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-primary">House Notes</p>
          <h1 className="text-3xl font-bold leading-tight">找房速查</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={onFitAll} aria-label="回到完整地圖範圍">
            <LocateFixed className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={onToggleCollapsed} aria-label="收納左側功能列">
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <CollapsibleSection
        title="交通"
        summary="YouBike 和公車"
        icon={<Bus className="h-4 w-4" />}
        open={openSections.traffic}
        onToggle={() => toggleSection("traffic")}
      >
        <div className="space-y-3">
          <SearchBox onSearchNearbyTransit={onSearchNearbyTransit} />
          {nearbyTransit ? (
            <NearbyTransitPanel
              result={nearbyTransit}
              nearbyTransitMarkersVisible={nearbyTransitMarkersVisible}
              onToggleNearbyTransitMarkers={onToggleNearbyTransitMarkers}
              onFocusAmenity={onFocusAmenity}
              onFocusRoute={onFocusRoute}
            />
          ) : null}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="圖層"
        summary="YouBike、市內公車、公路公車、學校、超商"
        icon={<LayersIcon className="h-4 w-4" />}
        open={openSections.layers}
        onToggle={() => {
          onClearScopedAmenities();
          toggleSection("layers");
        }}
      >
        <Layers enabledLayers={enabledLayers} onToggle={onToggleLayer} onToggleAll={onToggleAllLayers} />
      </CollapsibleSection>

      <CollapsibleSection
        title="物件"
        summary={`物件數量 ${communities.length}`}
        icon={<Building2 className="h-4 w-4" />}
        open={openSections.properties}
        onToggle={() => toggleSection("properties")}
      >
        <div className="space-y-3">
          <div className="flex justify-end" style={{ margin: "4px 0 8px" }}>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[10px] font-semibold text-primary hover:bg-transparent hover:text-primary"
              onClick={onAddCommunity}
            >
              新增
            </Button>
          </div>
          <PropertyList communities={communities} selectedId={selectedId} onSelectCommunity={onSelectCommunity} />
        </div>
      </CollapsibleSection>
    </aside>
  );
}

function CollapsedLegend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 6, marginTop: 4, whiteSpace: "nowrap" }}>
      <span
        style={{
          backgroundColor: color,
          border: "1px solid #fff",
          borderRadius: 9999,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18)",
          display: "inline-block",
          flex: "0 0 auto",
          height: 10,
          width: 10
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function CollapsibleSection({
  title,
  summary,
  icon,
  open,
  onToggle,
  children
}: {
  title: string;
  summary: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-white">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs font-bold"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="text-primary">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block">{title}</span>
          {!open ? <span className="mt-1 block truncate text-[10px] font-medium text-muted-foreground">{summary}</span> : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="border-t border-border p-2.5">{children}</div> : null}
    </section>
  );
}

function NearbyTransitPanel({
  result,
  nearbyTransitMarkersVisible,
  onToggleNearbyTransitMarkers,
  onFocusAmenity,
  onFocusRoute
}: {
  result: NearbyTransitResult;
  nearbyTransitMarkersVisible: boolean;
  onToggleNearbyTransitMarkers: () => void;
  onFocusAmenity: (amenity: Amenity) => void;
  onFocusRoute: (layer: BusRouteLayer, routeName: string) => void;
}) {
  return (
    <Card className="space-y-2 p-2">
      <div>
        <h2 className="text-xs font-bold">地圖中心附近交通</h2>
        <p className="text-[10px] text-muted-foreground">點選 YouBike 或公車路線可同步定位到地圖圖層點</p>
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <SmallCount icon={Bike} label="YouBike" value={result.youbikeStations.length} />
        <SmallCount icon={Bus} label="公車站" value={result.busStops.length} />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          className="h-6 px-1.5 text-[9px] font-semibold text-black hover:bg-transparent hover:text-black"
          onClick={onToggleNearbyTransitMarkers}
          disabled={!result.youbikeStations.length && !result.busStops.length}
        >
          {nearbyTransitMarkersVisible ? "隱藏" : "顯示"}
        </Button>
      </div>
      <div
        className="traffic-scrollbox space-y-2 overscroll-contain pr-1"
        style={{
          maxHeight: "28vh",
          minHeight: 120,
          overflowY: "scroll",
          scrollbarGutter: "stable"
        }}
        onTouchMove={(event) => event.stopPropagation()}
        onWheel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.scrollTop += event.deltaY;
        }}
      >
        <AmenityList title="YouBike" items={result.youbikeStations} onFocusAmenity={onFocusAmenity} />
        <RouteList
          title="市內公車路線"
          items={result.cityBusRoutes}
          onFocusRoute={(routeName) => onFocusRoute("city-bus", routeName)}
        />
        <RouteList
          title="公路公車路線"
          items={result.intercityBusRoutes}
          onFocusRoute={(routeName) => onFocusRoute("intercity-bus", routeName)}
        />
      </div>
    </Card>
  );
}

function SmallCount({ icon: Icon, label, value }: { icon: typeof Bike; label: string; value: number }) {
  return (
    <div
      className="rounded-md bg-muted"
      style={{
        alignItems: "flex-start",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        justifyContent: "center",
        minHeight: 32,
        minWidth: 0,
        padding: "5px"
      }}
    >
      <span style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 4, minWidth: 0, width: "100%" }}>
        <Icon className="shrink-0 text-primary" style={{ height: 13, width: 13 }} />
        <span className="text-muted-foreground" style={{ fontSize: 10, lineHeight: "12px", overflowWrap: "anywhere", whiteSpace: "normal" }}>
          {label}
        </span>
      </span>
      <strong style={{ fontSize: 13, lineHeight: "14px", overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  );
}

function AmenityList({
  title,
  items,
  onFocusAmenity
}: {
  title: string;
  items: Amenity[];
  onFocusAmenity: (amenity: Amenity) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, listPreviewLimit);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div>
      <h3 className="mb-1 text-xs font-bold text-muted-foreground">{title}</h3>
      {items.length ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                onClick={() => onFocusAmenity(item)}
              >
                {item.name}
              </button>
            ))}
          </div>
          {hiddenCount > 0 ? (
            <Button type="button" variant="outline" size="sm" className="h-7 w-full text-xs" onClick={() => setShowAll(true)}>
              顯示更多（{hiddenCount}）
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">沒有查到資料</p>
      )}
    </div>
  );
}

function RouteList({
  title,
  items,
  onFocusRoute
}: {
  title: string;
  items: string[];
  onFocusRoute: (routeName: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, listPreviewLimit);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div>
      <h3 className="mb-1 text-xs font-bold text-muted-foreground">{title}</h3>
      {items.length ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {visibleItems.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                onClick={() => onFocusRoute(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {hiddenCount > 0 ? (
            <Button type="button" variant="outline" size="sm" className="h-7 w-full text-xs" onClick={() => setShowAll(true)}>
              顯示更多（{hiddenCount}）
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">沒有查到資料</p>
      )}
    </div>
  );
}

function PropertyList({
  communities,
  selectedId,
  onSelectCommunity
}: {
  communities: Community[];
  selectedId?: string;
  onSelectCommunity: (id: string) => void;
}) {
  return (
    <section
      className="property-scrollbox space-y-2 overscroll-contain pr-1"
      style={{
        maxHeight: "34vh",
        minHeight: 120,
        overflowY: "scroll",
        scrollbarGutter: "stable"
      }}
      aria-label="物件列表"
      onTouchMove={(event) => event.stopPropagation()}
      onWheel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.scrollTop += event.deltaY;
      }}
    >
      {communities.length ? (
        communities.map((community) => (
          <button
            key={community.id}
            type="button"
            className={cn(
              "w-full rounded-lg border border-border bg-white p-2 text-left transition hover:border-primary hover:shadow-sm",
              selectedId === community.id && "border-primary shadow-sm"
            )}
            onClick={() => onSelectCommunity(community.id)}
          >
            <strong className="block text-xs">{community.name}</strong>
            <span className="mt-1 block text-[10px] text-muted-foreground">{community.address}</span>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
              <SmallMetric label="開價" value={community.pricePerPing} />
              <SmallMetric label="屋齡" value={community.age} />
              <SmallMetric label="評分" value={community.score ? `${community.score}` : "-"} icon />
            </div>
            {community.note ? <p className="mt-2 line-clamp-2 text-[10px] text-muted-foreground">{community.note}</p> : null}
          </button>
        ))
      ) : (
        <Card className="p-3 text-center text-xs text-muted-foreground">目前沒有物件資料</Card>
      )}
    </section>
  );
}

function SmallMetric({ label, value, icon = false }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-md bg-muted p-1.5">
      <span className="block text-[10px] text-muted-foreground">{label}</span>
      <strong className="mt-0.5 flex items-center gap-1">
        {icon ? <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> : null}
        {value}
      </strong>
    </div>
  );
}


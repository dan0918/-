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
  onToggleCollapsed: () => void;
  onSelectCommunity: (id: string) => void;
  onAddCommunity: () => void;
  onFitAll: () => void;
  onClearScopedAmenities: () => void;
  onToggleLayer: (layer: LayerKey) => void;
  onToggleAllLayers: () => void;
  onSearchNearbyTransit: () => void;
  onFocusAmenity: (amenity: Amenity) => void;
  onFocusRoute: (layer: BusRouteLayer, routeName: string) => void;
};

export function Sidebar({
  collapsed,
  communities,
  selectedId,
  enabledLayers,
  nearbyTransit,
  onToggleCollapsed,
  onSelectCommunity,
  onAddCommunity,
  onFitAll,
  onClearScopedAmenities,
  onToggleLayer,
  onToggleAllLayers,
  onSearchNearbyTransit,
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
            width: 96,
            zIndex: 1000
          }}
        >
          <Button
            type="button"
            size="default"
            className="rounded-md"
            style={{ fontSize: 10, height: 28, lineHeight: "12px", padding: "0 8px", whiteSpace: "nowrap", width: 78 }}
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
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-[1000] flex h-[100dvh] min-h-0 w-[min(380px,calc(100vw-56px))] max-w-[380px] flex-col gap-4 overflow-hidden border-r border-border bg-card p-4 shadow-2xl sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-primary">House Notes</p>
          <h1 className="text-3xl font-bold leading-tight">找房速查</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="icon" variant="outline" onClick={onFitAll} aria-label="回到完整地圖範圍">
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={onToggleCollapsed} aria-label="收納左側功能列">
            <PanelLeftClose className="h-4 w-4" />
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
            <NearbyTransitPanel result={nearbyTransit} onFocusAmenity={onFocusAmenity} onFocusRoute={onFocusRoute} />
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
          <Card className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <strong className="block text-xl leading-none">{communities.length}</strong>
                <span className="text-xs text-muted-foreground">物件數量</span>
              </div>
            </div>
            <div className="flex gap-2 self-end">
              <Button
                type="button"
                size="sm"
                className="h-9 px-4 text-sm text-stone-900 hover:brightness-95"
                style={{ backgroundColor: "#d6c59a" }}
                onClick={onAddCommunity}
              >
                新增
              </Button>
            </div>
          </Card>
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
        className="flex w-full items-center gap-2 px-3 py-3 text-left font-bold"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="text-primary">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block">{title}</span>
          {!open ? <span className="mt-1 block truncate text-xs font-medium text-muted-foreground">{summary}</span> : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="border-t border-border p-3">{children}</div> : null}
    </section>
  );
}

function NearbyTransitPanel({
  result,
  onFocusAmenity,
  onFocusRoute
}: {
  result: NearbyTransitResult;
  onFocusAmenity: (amenity: Amenity) => void;
  onFocusRoute: (layer: BusRouteLayer, routeName: string) => void;
}) {
  return (
    <Card className="space-y-3 p-3">
      <div>
        <h2 className="text-sm font-bold">地圖中心附近交通</h2>
        <p className="text-xs text-muted-foreground">點選 YouBike 或公車路線可同步定位到地圖圖層點</p>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <SmallCount icon={Bike} label="YouBike" value={result.youbikeStations.length} />
        <SmallCount icon={Bus} label="公車站" value={result.busStops.length} />
      </div>
      <div
        className="traffic-scrollbox space-y-2 overscroll-contain pr-1"
        style={{
          height: "min(42vh, 360px)",
          minHeight: 180,
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
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        minHeight: 34,
        padding: "6px 8px"
      }}
    >
      <span style={{ alignItems: "center", display: "flex", gap: 5, minWidth: 0 }}>
        <Icon className="shrink-0 text-primary" style={{ height: 13, width: 13 }} />
        <span className="text-muted-foreground" style={{ fontSize: 11, lineHeight: "12px", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </span>
      <strong style={{ fontSize: 15, lineHeight: "16px" }}>{value}</strong>
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
                className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                onClick={() => onFocusAmenity(item)}
              >
                {item.name}
              </button>
            ))}
          </div>
          {hiddenCount > 0 ? (
            <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={() => setShowAll(true)}>
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
                className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                onClick={() => onFocusRoute(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {hiddenCount > 0 ? (
            <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={() => setShowAll(true)}>
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
        height: "min(48vh, 420px)",
        minHeight: 180,
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
              "w-full rounded-lg border border-border bg-white p-3 text-left transition hover:border-primary hover:shadow-sm",
              selectedId === community.id && "border-primary shadow-sm"
            )}
            onClick={() => onSelectCommunity(community.id)}
          >
            <strong className="block text-base">{community.name}</strong>
            <span className="mt-1 block text-sm text-muted-foreground">{community.address}</span>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <SmallMetric label="開價" value={community.pricePerPing} />
              <SmallMetric label="屋齡" value={community.age} />
              <SmallMetric label="評分" value={community.score ? `${community.score}` : "-"} icon />
            </div>
            {community.note ? <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{community.note}</p> : null}
          </button>
        ))
      ) : (
        <Card className="p-4 text-center text-sm text-muted-foreground">目前沒有物件資料</Card>
      )}
    </section>
  );
}

function SmallMetric({ label, value, icon = false }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="mt-1 flex items-center gap-1">
        {icon ? <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> : null}
        {value}
      </strong>
    </div>
  );
}


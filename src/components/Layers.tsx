import { Button } from "@/components/ui/button";
import type { LayerKey } from "@/types/community";

export const layerOptions: Array<{
  key: LayerKey;
  label: string;
  description: string;
  markerColor: string;
}> = [
  { key: "youbike", label: "YouBike", description: "YouBike 站點", markerColor: "#facc15" },
  { key: "city-bus", label: "市內公車", description: "市區公車站牌", markerColor: "#2563eb" },
  { key: "intercity-bus", label: "公路公車", description: "公路客運站牌", markerColor: "#16a34a" },
  { key: "school", label: "學校", description: "學校位置", markerColor: "#f97316" },
  { key: "convenience-store", label: "超商", description: "便利商店", markerColor: "#ef4444" }
];

type LayersProps = {
  enabledLayers: Record<LayerKey, boolean>;
  onToggle: (layer: LayerKey) => void;
  onToggleAll: () => void;
};

export function Layers({ enabledLayers, onToggle, onToggleAll }: LayersProps) {
  const allEnabled = layerOptions.every((layer) => enabledLayers[layer.key]);

  return (
    <section className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 px-1.5 text-[10px] font-semibold text-primary hover:bg-transparent hover:text-primary"
          onClick={onToggleAll}
        >
          {allEnabled ? "全部關閉" : "全部開啟"}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {layerOptions.map((layer) => {
          const active = enabledLayers[layer.key];
          return (
            <Button
              key={layer.key}
              type="button"
              variant={active ? "default" : "outline"}
              className="h-8 justify-start gap-1.5 px-2 text-[10px] leading-tight"
              onClick={() => onToggle(layer.key)}
              aria-pressed={active}
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow-sm ring-1 ring-border"
                style={{ backgroundColor: layer.markerColor }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-left">{layer.label}</span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}

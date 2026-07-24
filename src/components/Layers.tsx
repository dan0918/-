import { Button } from "@/components/ui/button";
import type { LayerKey } from "@/types/community";

export const layerOptions: Array<{
  key: LayerKey;
  label: string;
  description: string;
  markerColor: string;
}> = [
  { key: "youbike", label: "YouBike", description: "YouBike 站點", markerColor: "#facc15" },
  { key: "city-bus", label: "市內公車", description: "桃園市區公車站", markerColor: "#2563eb" },
  { key: "intercity-bus", label: "公路公車", description: "公路客運站", markerColor: "#16a34a" },
  { key: "school", label: "學校", description: "國小與國中", markerColor: "#f97316" },
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
    <section className="space-y-3">
      <Button type="button" variant="secondary" className="w-full justify-center" onClick={onToggleAll}>
        {allEnabled ? "全部關閉" : "全部開啟"}
      </Button>

      <div className="grid grid-cols-1 gap-2">
        {layerOptions.map((layer) => {
          const active = enabledLayers[layer.key];
          return (
            <Button
              key={layer.key}
              type="button"
              variant={active ? "default" : "outline"}
              className="h-11 justify-start px-3"
              onClick={() => onToggle(layer.key)}
              aria-pressed={active}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-full border-2 border-white shadow-sm ring-1 ring-border"
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

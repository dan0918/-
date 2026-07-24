import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchBoxProps = {
  onSearchNearbyTransit: () => void;
};

export function SearchBox({ onSearchNearbyTransit }: SearchBoxProps) {
  return (
    <Button type="button" variant="secondary" className="w-full justify-center" onClick={onSearchNearbyTransit}>
      <LocateFixed className="h-4 w-4" />
      查詢地圖中心附近交通
    </Button>
  );
}

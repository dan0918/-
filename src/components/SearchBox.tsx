import { Button } from "@/components/ui/button";

type SearchBoxProps = {
  onSearchNearbyTransit: () => void;
};

export function SearchBox({ onSearchNearbyTransit }: SearchBoxProps) {
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-6 px-1.5 text-[10px] font-semibold text-primary hover:bg-transparent hover:text-primary"
        onClick={onSearchNearbyTransit}
      >
        選取範圍
      </Button>
    </div>
  );
}

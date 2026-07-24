export type Community = {
  id: string;
  name: string;
  address: string;
  station: string;
  lat: number;
  lng: number;
  pricePerPing: string;
  age: string;
  sourceUrl?: string;
  note: string;
  score: number;
};

export type LayerKey = "youbike" | "city-bus" | "intercity-bus" | "school" | "convenience-store";

export type Amenity = {
  id: string;
  type: LayerKey;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  items?: Array<{
    id: string;
    name: string;
    routeName?: string;
    source?: string;
  }>;
};

export type MapQueryBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type NearbyTransitResult = {
  bounds?: MapQueryBounds;
  youbikeStations: Amenity[];
  busStops: Amenity[];
  cityBusRoutes: string[];
  intercityBusRoutes: string[];
};

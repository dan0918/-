export const mapBounds = {
  west: 121.2833333333,
  east: 121.3305555556,
  south: 24.95,
  north: 25.0472222222
};

export const mapCenter: [number, number] = [25.012313, 121.30016];

export const leafletMaxBounds: [[number, number], [number, number]] = [
  [mapBounds.south, mapBounds.west],
  [mapBounds.north, mapBounds.east]
];

export function isInsideMapBounds(lat: number, lng: number) {
  return lat >= mapBounds.south && lat <= mapBounds.north && lng >= mapBounds.west && lng <= mapBounds.east;
}

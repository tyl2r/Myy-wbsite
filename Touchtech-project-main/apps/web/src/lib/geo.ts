export interface LatLng {
  lat: number;
  lng: number;
}

const R = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in meters; mirrors the backend quote input. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

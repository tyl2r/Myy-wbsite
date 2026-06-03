/**
 * Pure geospatial helpers used by matching and route-compatibility logic.
 * Kept dependency-free and side-effect-free so they are trivially unit-tested.
 * Heavy geometry (corridor buffers against real road networks) is delegated to
 * PostGIS in queries; these are the in-memory approximations used for scoring.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in meters. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Total length of an ordered path, in meters. */
export function pathLengthMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Shortest distance from a point to a line segment, in meters.
 * Uses an equirectangular projection local to the segment, accurate enough for
 * the short distances involved in corridor checks.
 */
export function pointToSegmentMeters(
  p: LatLng,
  a: LatLng,
  b: LatLng,
): number {
  const latRef = toRad((a.lat + b.lat) / 2);
  const project = (pt: LatLng) => ({
    x: toRad(pt.lng) * Math.cos(latRef) * EARTH_RADIUS_M,
    y: toRad(pt.lat) * EARTH_RADIUS_M,
  });

  const pp = project(p);
  const pa = project(a);
  const pb = project(b);

  const dx = pb.x - pa.x;
  const dy = pb.y - pa.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return haversineMeters(p, a);

  let t = ((pp.x - pa.x) * dx + (pp.y - pa.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const proj = { x: pa.x + t * dx, y: pa.y + t * dy };
  return Math.hypot(pp.x - proj.x, pp.y - proj.y);
}

/** Minimum distance from a point to a polyline corridor centerline, in meters. */
export function distanceToCorridorMeters(
  point: LatLng,
  corridor: LatLng[],
): number {
  if (corridor.length === 0) return Infinity;
  if (corridor.length === 1) return haversineMeters(point, corridor[0]);

  let min = Infinity;
  for (let i = 1; i < corridor.length; i++) {
    min = Math.min(min, pointToSegmentMeters(point, corridor[i - 1], corridor[i]));
  }
  return min;
}

/**
 * Detour ratio added by inserting extra stops: (newLength - baseLength) / baseLength.
 * Returns 0 when the base path has no length to avoid division by zero.
 */
export function detourRatio(baseLength: number, newLength: number): number {
  if (baseLength <= 0) return 0;
  return (newLength - baseLength) / baseLength;
}

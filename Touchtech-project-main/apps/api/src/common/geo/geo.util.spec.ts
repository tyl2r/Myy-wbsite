import {
  haversineMeters,
  pathLengthMeters,
  distanceToCorridorMeters,
  detourRatio,
} from './geo.util';

describe('geo utilities', () => {
  it('computes haversine distance within tolerance', () => {
    // ~1.11 km between 0,0 and 0.01,0 (0.01 deg latitude).
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 0.01, lng: 0 });
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1120);
  });

  it('returns zero distance for identical points', () => {
    expect(haversineMeters({ lat: 10, lng: 10 }, { lat: 10, lng: 10 })).toBe(0);
  });

  it('sums path length across segments', () => {
    const len = pathLengthMeters([
      { lat: 0, lng: 0 },
      { lat: 0.01, lng: 0 },
      { lat: 0.02, lng: 0 },
    ]);
    expect(len).toBeGreaterThan(2200);
    expect(len).toBeLessThan(2240);
  });

  it('measures distance from a point to a corridor centerline', () => {
    const corridor = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.1 },
    ];
    // Point offset north of the mid-corridor.
    const d = distanceToCorridorMeters({ lat: 0.005, lng: 0.05 }, corridor);
    expect(d).toBeGreaterThan(500);
    expect(d).toBeLessThan(600);
  });

  it('computes detour ratio and guards against zero base', () => {
    expect(detourRatio(1000, 1200)).toBeCloseTo(0.2);
    expect(detourRatio(0, 500)).toBe(0);
  });
});

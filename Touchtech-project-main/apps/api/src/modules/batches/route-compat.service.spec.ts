import { RouteCompatService, RequestLeg } from './route-compat.service';
import { LatLng } from '../../common/geo/geo.util';

describe('RouteCompatService', () => {
  const service = new RouteCompatService();

  // A roughly straight west-to-east corridor.
  const corridor: LatLng[] = [
    { lat: 59.33, lng: 18.0 },
    { lat: 59.33, lng: 18.1 },
  ];

  it('accepts a request whose endpoints sit on the corridor', () => {
    const candidate: RequestLeg = {
      requestId: 1n,
      pickup: { lat: 59.331, lng: 18.02 },
      dropoff: { lat: 59.331, lng: 18.08 },
    };
    const result = service.evaluate(corridor, [], candidate, 30);
    expect(result.compatible).toBe(true);
  });

  it('rejects a request far off the corridor', () => {
    const candidate: RequestLeg = {
      requestId: 2n,
      pickup: { lat: 59.5, lng: 18.5 },
      dropoff: { lat: 59.6, lng: 18.6 },
    };
    const result = service.evaluate(corridor, [], candidate, 30);
    expect(result.compatible).toBe(false);
    expect(result.reason).toMatch(/corridor/i);
  });

  it('never orders a dropoff before its pickup', () => {
    const legs: RequestLeg[] = [
      {
        requestId: 1n,
        pickup: { lat: 59.33, lng: 18.02 },
        dropoff: { lat: 59.33, lng: 18.09 },
      },
      {
        requestId: 2n,
        pickup: { lat: 59.33, lng: 18.04 },
        dropoff: { lat: 59.33, lng: 18.06 },
      },
    ];
    const stops = service.orderStops({ lat: 59.33, lng: 18.0 }, legs);

    const seen = new Set<string>();
    for (const stop of stops) {
      if (stop.type === 'dropoff') {
        expect(seen.has(stop.requestId.toString())).toBe(true);
      } else {
        seen.add(stop.requestId.toString());
      }
    }
    expect(stops).toHaveLength(4);
  });
});

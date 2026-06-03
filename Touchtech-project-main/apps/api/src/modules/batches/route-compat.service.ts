import { Injectable } from '@nestjs/common';
import {
  LatLng,
  distanceToCorridorMeters,
  pathLengthMeters,
  detourRatio,
} from '../../common/geo/geo.util';

export interface Stop {
  requestId: bigint;
  type: 'pickup' | 'dropoff';
  point: LatLng;
}

export interface RequestLeg {
  requestId: bigint;
  pickup: LatLng;
  dropoff: LatLng;
}

export interface CompatibilityResult {
  compatible: boolean;
  corridorDistanceM: number;
  detour: number;
  reason?: string;
}

/**
 * Encapsulates the "can this worker take this request without breaking their
 * route" decision. Two gates must both pass:
 *   1. Both endpoints lie within `corridorRadiusM` of the planned corridor.
 *   2. Inserting the request adds no more than `maxDetourPct` to the route.
 * The in-memory math here is an approximation used for fast scoring; the
 * authoritative corridor test is also enforced in SQL via ST_DWithin.
 */
@Injectable()
export class RouteCompatService {
  private readonly corridorRadiusM = 1500;

  evaluate(
    corridor: LatLng[],
    existingLegs: RequestLeg[],
    candidate: RequestLeg,
    maxDetourPct: number,
  ): CompatibilityResult {
    const pickupDist = distanceToCorridorMeters(candidate.pickup, corridor);
    const dropoffDist = distanceToCorridorMeters(candidate.dropoff, corridor);
    const corridorDistanceM = Math.max(pickupDist, dropoffDist);

    if (corridorDistanceM > this.corridorRadiusM) {
      return {
        compatible: false,
        corridorDistanceM,
        detour: 0,
        reason: 'Endpoints fall outside the route corridor',
      };
    }

    const baseStops = this.orderStops(corridor[0], existingLegs);
    const withStops = this.orderStops(corridor[0], [
      ...existingLegs,
      candidate,
    ]);

    const baseLength = pathLengthMeters(baseStops.map((s) => s.point));
    const newLength = pathLengthMeters(withStops.map((s) => s.point));
    const detour = detourRatio(baseLength, newLength);

    if (detour > maxDetourPct / 100) {
      return {
        compatible: false,
        corridorDistanceM,
        detour,
        reason: `Adds ${(detour * 100).toFixed(1)}% detour, over the ${maxDetourPct}% limit`,
      };
    }

    return { compatible: true, corridorDistanceM, detour };
  }

  /**
   * Greedy nearest-neighbor ordering that never schedules a dropoff before its
   * pickup. Good enough for the small stop counts in a single batch; a true
   * VRP solver would replace this at scale.
   */
  orderStops(start: LatLng, legs: RequestLeg[]): Stop[] {
    const pending: Stop[] = [];
    for (const leg of legs) {
      pending.push({ requestId: leg.requestId, type: 'pickup', point: leg.pickup });
      pending.push({ requestId: leg.requestId, type: 'dropoff', point: leg.dropoff });
    }

    const pickedUp = new Set<string>();
    const route: Stop[] = [];
    let cursor = start;

    while (pending.length > 0) {
      let bestIdx = -1;
      let bestDist = Infinity;

      for (let i = 0; i < pending.length; i++) {
        const stop = pending[i];
        // A dropoff is only eligible once its pickup has been visited.
        if (
          stop.type === 'dropoff' &&
          !pickedUp.has(stop.requestId.toString())
        ) {
          continue;
        }
        const d = this.squaredDist(cursor, stop.point);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      const [next] = pending.splice(bestIdx, 1);
      if (next.type === 'pickup') pickedUp.add(next.requestId.toString());
      route.push(next);
      cursor = next.point;
    }

    return route;
  }

  private squaredDist(a: LatLng, b: LatLng): number {
    const dLat = a.lat - b.lat;
    const dLng = a.lng - b.lng;
    return dLat * dLat + dLng * dLng;
  }
}

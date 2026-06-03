import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain.error';
import { RouteCompatService, RequestLeg } from './route-compat.service';
import { LatLng } from '../../common/geo/geo.util';
import { NotificationsService } from '../notifications/notifications.service';

interface NearbyRow {
  id: bigint;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  distance_m: number;
}

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compat: RouteCompatService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Open requests whose pickup lies within `radiusM` of the worker, ordered by
   * proximity. Uses the partial GiST index on open requests (ST_DWithin).
   */
  async nearby(center: LatLng, radiusM: number, limit: number) {
    const rows = await this.prisma.$queryRaw<NearbyRow[]>(Prisma.sql`
      SELECT id,
             ST_Y(pickup_geom::geometry)  AS pickup_lat,
             ST_X(pickup_geom::geometry)  AS pickup_lng,
             ST_Y(dropoff_geom::geometry) AS dropoff_lat,
             ST_X(dropoff_geom::geometry) AS dropoff_lng,
             ST_Distance(
               pickup_geom,
               ST_SetSRID(ST_MakePoint(${center.lng}, ${center.lat}), 4326)::geography
             )::int AS distance_m
      FROM requests
      WHERE status IN ('created', 'matched')
        AND ST_DWithin(
              pickup_geom,
              ST_SetSRID(ST_MakePoint(${center.lng}, ${center.lat}), 4326)::geography,
              ${radiusM}
            )
      ORDER BY distance_m ASC
      LIMIT ${limit}
    `);
    return { data: rows };
  }

  /**
   * Accepts one or more requests into a single batch for a worker.
   * Guarantees, inside one transaction:
   *   - the worker is verified
   *   - every request is still open
   *   - each request joins at most one batch (DB unique on batch_items)
   *   - requests move to 'accepted' with an audit event
   */
  async accept(workerId: bigint, requestIds: bigint[]) {
    if (requestIds.length === 0) {
      throw new ValidationError('At least one request is required');
    }

    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
      select: { verification: true },
    });
    if (!profile) throw new NotFoundError('Worker profile not found');
    if (profile.verification !== 'verified') {
      throw new ForbiddenError('Worker is not verified');
    }

    return this.prisma.$transaction(async (tx) => {
      const requests = await tx.request.findMany({
        where: { id: { in: requestIds } },
      });

      if (requests.length !== requestIds.length) {
        throw new NotFoundError('One or more requests no longer exist');
      }
      const notOpen = requests.filter(
        (r) => r.status !== 'created' && r.status !== 'matched',
      );
      if (notOpen.length > 0) {
        throw new ConflictError('One or more requests are no longer available', {
          unavailable: notOpen.map((r) => r.id.toString()),
        });
      }

      const legs = await this.loadLegs(tx, requestIds);
      const stopOrder = this.compat
        .orderStops(legs[0].pickup, legs)
        .map((s, i) => ({
          requestId: s.requestId.toString(),
          type: s.type,
          seq: i,
        }));

      const batch = await tx.batch.create({
        data: {
          workerId,
          status: 'active',
          stopOrder,
          startedAt: new Date(),
          items: {
            create: requestIds.map((requestId, idx) => ({
              requestId,
              sequence: idx,
            })),
          },
        },
        select: { id: true, stopOrder: true },
      });

      for (const r of requests) {
        await tx.request.update({
          where: { id: r.id },
          data: { status: 'accepted' },
        });
        await tx.statusEvent.create({
          data: {
            requestId: r.id,
            fromStatus: r.status,
            toStatus: 'accepted',
            actorId: workerId,
            reason: `Accepted into batch ${batch.id}`,
          },
        });
      }

      return { batch, requests };
    }).then(async ({ batch, requests }) => {
      // Notify each customer that their request was accepted (post-commit).
      for (const r of requests) {
        await this.notifications.safeNotify(r.userId, 'assignment', {
          requestId: r.id.toString(),
          batchId: batch.id.toString(),
        });
      }
      return {
        data: {
          batchId: batch.id,
          stopOrder: batch.stopOrder,
        },
      };
    });
  }

  async myBatches(workerId: bigint) {
    const batches = await this.prisma.batch.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return { data: batches };
  }

  private async loadLegs(
    tx: Prisma.TransactionClient,
    requestIds: bigint[],
  ): Promise<RequestLeg[]> {
    const rows = await tx.$queryRaw<
      {
        id: bigint;
        pickup_lat: number;
        pickup_lng: number;
        dropoff_lat: number;
        dropoff_lng: number;
      }[]
    >(Prisma.sql`
      SELECT id,
             ST_Y(pickup_geom::geometry)  AS pickup_lat,
             ST_X(pickup_geom::geometry)  AS pickup_lng,
             ST_Y(dropoff_geom::geometry) AS dropoff_lat,
             ST_X(dropoff_geom::geometry) AS dropoff_lng
      FROM requests
      WHERE id IN (${Prisma.join(requestIds)})
    `);

    return rows.map((r) => ({
      requestId: r.id,
      pickup: { lat: r.pickup_lat, lng: r.pickup_lng },
      dropoff: { lat: r.dropoff_lat, lng: r.dropoff_lng },
    }));
  }
}

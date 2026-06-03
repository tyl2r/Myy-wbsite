import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisPresenceService } from './redis-presence.service';
import { LatLng } from '../../common/geo/geo.util';
import { ForbiddenError } from '../../common/errors/domain.error';

export interface Ping {
  batchId: bigint;
  point: LatLng;
  speedMps?: number;
}

/**
 * Tracking business logic, independent of the transport (WS gateway calls in).
 * Verifies the worker owns the batch, updates Redis presence, persists the
 * ping for history, and returns the customer rooms that should receive it.
 */
@Injectable()
export class TrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: RedisPresenceService,
  ) {}

  async ingest(workerId: bigint, ping: Ping): Promise<{ requestIds: bigint[] }> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: ping.batchId },
      include: { items: { select: { requestId: true } } },
    });

    if (!batch || batch.workerId !== workerId) {
      throw new ForbiddenError('Worker does not own this batch');
    }

    await this.presence.setPosition(workerId, ping.point);

    // Persist to the partitioned history table (geography via raw SQL).
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO location_pings (worker_id, batch_id, geom, speed_mps, recorded_at)
      VALUES (
        ${workerId},
        ${ping.batchId},
        ST_SetSRID(ST_MakePoint(${ping.point.lng}, ${ping.point.lat}), 4326)::geography,
        ${ping.speedMps ?? null},
        now()
      )
    `);

    return { requestIds: batch.items.map((i) => i.requestId) };
  }
}

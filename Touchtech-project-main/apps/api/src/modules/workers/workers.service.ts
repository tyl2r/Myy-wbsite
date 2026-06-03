import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain.error';
import { LatLng } from '../../common/geo/geo.util';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(workerId: bigint) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
    });
    if (!profile) throw new NotFoundError('Worker profile not found');
    return { data: profile };
  }

  /**
   * Availability can only be enabled once an admin has verified the worker.
   * This is the gate that keeps unverified workers out of the matching pool.
   */
  async setAvailability(workerId: bigint, isAvailable: boolean) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
      select: { verification: true },
    });
    if (!profile) throw new NotFoundError('Worker profile not found');

    if (isAvailable && profile.verification !== 'verified') {
      throw new ForbiddenError(
        'Worker must be verified before going available',
      );
    }

    const updated = await this.prisma.workerProfile.update({
      where: { userId: workerId },
      data: { isAvailable, lastSeenAt: new Date() },
    });
    return { data: updated };
  }

  /**
   * Persists the worker's live location. Geography is not a Prisma-typed column,
   * so it is written with a parameterized ST_SetSRID/ST_MakePoint raw statement.
   */
  async updateLocation(workerId: bigint, point: LatLng): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE worker_profiles
        SET current_location = ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)::geography,
            last_seen_at = now()
        WHERE user_id = ${workerId}
      `,
    );
  }

  /** Sets the worker's planned route corridor from an ordered list of points. */
  async updateCorridor(workerId: bigint, points: LatLng[]): Promise<void> {
    const wkt = `LINESTRING(${points
      .map((p) => `${p.lng} ${p.lat}`)
      .join(', ')})`;
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE worker_profiles
        SET route_corridor = ST_SetSRID(ST_GeomFromText(${wkt}), 4326)::geography
        WHERE user_id = ${workerId}
      `,
    );
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus, UserRole, WorkerVerification } from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConflictError,
  NotFoundError,
} from '../../common/errors/domain.error';
import { RequestsService } from '../requests/requests.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requests: RequestsService,
  ) {}

  async listUsers(role: UserRole | undefined, cursor: bigint | undefined, limit: number) {
    const items = await this.prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id: true, email: true, fullName: true, role: true,
        status: true, ratingAvg: true, createdAt: true,
      },
      orderBy: { id: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor = items.length === limit ? items[items.length - 1].id : null;
    return { data: items, meta: { nextCursor } };
  }

  async setUserStatus(userId: bigint, status: 'active' | 'suspended') {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, status: true },
    });
    return { data: user };
  }

  async verifyWorker(workerId: bigint, decision: WorkerVerification) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
    });
    if (!profile) throw new NotFoundError('Worker profile not found');

    const updated = await this.prisma.workerProfile.update({
      where: { userId: workerId },
      data: {
        verification: decision,
        // Revoking verification also forces the worker offline.
        isAvailable: decision === 'verified' ? profile.isAvailable : false,
      },
    });
    return { data: updated };
  }

  /** Force-cancel any request regardless of owner (admin oversight). */
  async forceCancel(requestId: bigint, adminId: bigint, reason: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { status: true },
    });
    if (!request) throw new NotFoundError('Request not found');
    if (['confirmed', 'cancelled', 'failed'].includes(request.status)) {
      throw new ConflictError('Request is already in a terminal state');
    }
    return this.requests.transition(
      requestId,
      request.status,
      'cancelled',
      adminId,
      reason,
    );
  }

  /** Live snapshot of currently active deliveries for the operations map. */
  async liveSnapshot() {
    const rows = await this.prisma.$queryRaw<
      { batch_id: bigint; worker_id: bigint; lat: number; lng: number; at: Date }[]
    >(Prisma.sql`
      SELECT DISTINCT ON (lp.batch_id)
             lp.batch_id,
             lp.worker_id,
             ST_Y(lp.geom::geometry) AS lat,
             ST_X(lp.geom::geometry) AS lng,
             lp.recorded_at AS at
      FROM location_pings lp
      JOIN batches b ON b.id = lp.batch_id AND b.status = 'active'
      ORDER BY lp.batch_id, lp.recorded_at DESC
    `);
    return { data: rows };
  }

  /** Aggregate operational metrics for the admin dashboard. */
  async metrics() {
    const byStatus = await this.prisma.request.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const activeWorkers = await this.prisma.workerProfile.count({
      where: { isAvailable: true },
    });
    const counts = byStatus.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    const delivered = (counts['delivered'] ?? 0) + (counts['confirmed'] ?? 0);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return {
      data: {
        requestsByStatus: counts,
        activeWorkers,
        fulfillmentRate: total ? +(delivered / total).toFixed(3) : 0,
      },
    };
  }
}

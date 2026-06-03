import { Injectable } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestsRepository } from './requests.repository';
import {
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain.error';
import {
  assertTransition,
  USER_CANCELLABLE,
} from './request-status';
import { CreateRequestDto, ListRequestsDto } from './dto/request.dto';
import { haversineMeters } from '../../common/geo/geo.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: RequestsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: bigint, dto: CreateRequestDto) {
    const priceCents = this.quote(dto);
    const id = await this.repo.create(userId, dto, priceCents);
    // Record the initial status event and notify the user.
    // Note: recordEvent and safeNotify are kept separate so a notification
    // failure never prevents the status event from being written.
    await this.recordEvent(id, null, 'created', userId);
    await this.notifications.safeNotify(userId, 'status_change', {
      requestId: id.toString(),
      status: 'created',
    });
    return this.getOwned(id, userId);
  }

  async getOwned(id: bigint, userId: bigint, isAdmin = false) {
    const request = await this.repo.findById(id);
    if (!request) throw new NotFoundError('Request not found');
    if (!isAdmin && request.userId !== userId) {
      throw new ForbiddenError('You do not own this request');
    }
    return { data: request };
  }

  async list(userId: bigint, query: ListRequestsDto) {
    const items = await this.repo.listForUser(
      userId,
      query.status,
      query.cursor,
      query.limit,
    );
    const nextCursor =
      items.length === query.limit ? items[items.length - 1].id : null;
    return { data: items, meta: { nextCursor } };
  }

  /** Customer-initiated cancellation, allowed only before pickup. */
  async cancel(id: bigint, userId: bigint) {
    const request = await this.repo.findById(id);
    if (!request) throw new NotFoundError('Request not found');
    if (request.userId !== userId) {
      throw new ForbiddenError('You do not own this request');
    }
    if (!USER_CANCELLABLE.includes(request.status)) {
      throw new ForbiddenError(
        'Request can no longer be cancelled by the customer',
      );
    }
    return this.transition(id, request.status, 'cancelled', userId);
  }

  /** Customer confirms a delivered request, closing the lifecycle. */
  async confirm(id: bigint, userId: bigint) {
    const request = await this.repo.findById(id);
    if (!request) throw new NotFoundError('Request not found');
    if (request.userId !== userId) {
      throw new ForbiddenError('You do not own this request');
    }
    return this.transition(id, request.status, 'confirmed', userId);
  }

  /**
   * Generic guarded transition shared by user/worker/admin flows. Validates the
   * move, then updates status and appends the audit event atomically.
   */
  async transition(
    id: bigint,
    from: RequestStatus,
    to: RequestStatus,
    actorId: bigint,
    reason?: string,
  ) {
    assertTransition(from, to);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.request.update({
        where: { id },
        data: { status: to },
      });
      await tx.statusEvent.create({
        data: { requestId: id, fromStatus: from, toStatus: to, actorId, reason },
      });
      return row;
    });

    // Notify the request owner out-of-band; never let it fail the transition.
    await this.notifications.safeNotify(updated.userId, 'status_change', {
      requestId: id.toString(),
      from,
      to,
      reason: reason ?? null,
    });

    return { data: updated };
  }

  private async recordEvent(
    requestId: bigint,
    from: RequestStatus | null,
    to: RequestStatus,
    actorId: bigint,
  ) {
    await this.prisma.statusEvent.create({
      data: { requestId, fromStatus: from, toStatus: to, actorId },
    });
  }

  /**
   * Transparent distance-based quote: base fee plus a per-kilometer rate and a
   * package-size multiplier. Deterministic so the price is reproducible.
   */
  private quote(dto: CreateRequestDto): number {
    const km = haversineMeters(dto.pickup, dto.dropoff) / 1000;
    const baseCents = 300;
    const perKmCents = 120;
    const sizeMultiplier: Record<string, number> = {
      xs: 1, s: 1.1, m: 1.25, l: 1.5, xl: 2,
    };
    const raw = (baseCents + perKmCents * km) * sizeMultiplier[dto.packageSize];
    return Math.round(raw);
  }
}

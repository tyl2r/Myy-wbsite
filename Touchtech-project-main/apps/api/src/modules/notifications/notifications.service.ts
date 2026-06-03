import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Used by other services to emit a notification as part of their flow. */
  async notify(
    userId: bigint,
    type: NotificationType,
    payload: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, type, payload },
    });
  }

  /**
   * Best-effort notify: swallows errors so a notification failure can never
   * roll back or break the business operation that triggered it.
   */
  async safeNotify(
    userId: bigint,
    type: NotificationType,
    payload: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.notify(userId, type, payload).catch(() => undefined);
  }

  async list(userId: bigint, cursor: bigint | undefined, limit: number) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor =
      items.length === limit ? items[items.length - 1].id : null;
    return { data: items, meta: { nextCursor } };
  }

  async unreadCount(userId: bigint) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { data: { count } };
  }

  async markRead(userId: bigint, id: bigint) {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { data: { ok: true } };
  }

  async markAllRead(userId: bigint) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { data: { ok: true } };
  }
}

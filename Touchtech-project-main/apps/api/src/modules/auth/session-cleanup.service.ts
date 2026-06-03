import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Periodically purges expired and revoked sessions from the database.
 * Without this, the sessions table grows unboundedly since every login
 * creates a new row and refresh token rotation never deletes old ones.
 *
 * Runs every day at 03:00 UTC to avoid peak traffic.
 */
@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const cutoff = new Date();
      const { count } = await this.prisma.session.deleteMany({
        where: {
          OR: [
            // Expired sessions (token TTL elapsed).
            { expiresAt: { lt: cutoff } },
            // Revoked sessions older than 7 days (keep recent ones for audit).
            {
              revokedAt: {
                lt: new Date(cutoff.getTime() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      });
      if (count > 0) {
        this.logger.log(`Session cleanup: removed ${count} expired/revoked sessions`);
      }
    } catch (err) {
      this.logger.error('Session cleanup failed', err);
    }
  }
}

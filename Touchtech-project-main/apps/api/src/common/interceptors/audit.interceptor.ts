import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_KEY, AuditMeta } from '../decorators/audit.decorator';

/**
 * Persists an audit_logs row after an @Audit-decorated handler succeeds.
 * Failures to write the audit record are swallowed (logged upstream) so they
 * never mask a successful business operation.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_KEY, ctx.getHandler());
    if (!meta) return next.handle();

    const req = ctx.switchToHttp().getRequest();
    const actorId = req.user?.id ?? null;
    const entityId = req.params?.id ? BigInt(req.params.id) : null;

    return next.handle().pipe(
      tap(() => {
        void this.prisma.auditLog
          .create({
            data: {
              actorId,
              action: meta.action,
              entityType: meta.entityType,
              entityId,
              metadata: { method: req.method, path: req.url },
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}

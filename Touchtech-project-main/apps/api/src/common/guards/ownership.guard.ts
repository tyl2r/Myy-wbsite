import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ForbiddenError } from '../errors/domain.error';

/**
 * Base class for per-resource ownership checks. Concrete guards implement
 * `owns()` to assert the current user may act on the addressed resource.
 * Admins bypass ownership by design (full oversight).
 */
@Injectable()
export abstract class OwnershipGuard implements CanActivate {
  protected abstract owns(
    userId: bigint,
    resourceId: bigint,
  ): Promise<boolean>;

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (user?.role === 'admin') return true;

    const resourceId = BigInt(req.params?.id);
    if (await this.owns(user.id, resourceId)) return true;

    throw new ForbiddenError('You do not own this resource');
  }
}

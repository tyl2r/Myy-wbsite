import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: bigint;
  role: 'admin' | 'user' | 'worker';
  email: string;
}

/** Injects the authenticated principal attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser;
  },
);

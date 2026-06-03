import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TokenService } from './token.service';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/domain.error';
import { RegisterDto, LoginDto } from './dto/auth.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
        // Workers must be verified by an admin before they can go available.
        // Vehicle defaults to 'bike' if not specified at registration.
        workerProfile:
          dto.role === 'worker'
            ? { create: { vehicle: dto.vehicle ?? 'bike' } }
            : undefined,
      },
    });

    return this.issuePair(user.id, user.role, user.email, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Constant-ish work whether or not the user exists, to limit enumeration.
    const hash =
      user?.passwordHash ??
      '$argon2id$v=19$m=65536,t=3,p=4$invalidsaltvalue$invalidhashvalue';
    const ok = await argon2.verify(hash, dto.password).catch(() => false);

    if (!user || !ok || user.status !== 'active') {
      throw new UnauthorizedError('Invalid credentials');
    }

    return this.issuePair(user.id, user.role, user.email, meta);
  }

  /**
   * Rotates a refresh token: validates it against an active session, revokes
   * the old session, and issues a fresh pair. A presented-but-revoked token is
   * treated as reuse and rejected.
   */
  async refresh(rawToken: string, meta: RequestMeta): Promise<TokenPair> {
    if (!rawToken) throw new UnauthorizedError('Refresh token is missing');
    const hash = this.tokens.hashRefresh(rawToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshHash: hash },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issuePair(
      session.user.id,
      session.user.role,
      session.user.email,
      meta,
    );
  }

  async logout(rawToken: string): Promise<void> {
    const hash = this.tokens.hashRefresh(rawToken);
    await this.prisma.session.updateMany({
      where: { refreshHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Initiates password recovery. Always returns success to prevent email
   * enumeration. Stores a short-lived reset token hashed in the DB.
   * In production, send the token via email (e.g. Resend/SendGrid).
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.tokens.hashRefresh(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Reuse the sessions table with a special marker, or use a dedicated
      // password_reset_tokens table in a future migration. For now we store
      // the hash in a session row with a sentinel refresh hash prefix.
      await this.prisma.session.create({
        data: {
          userId: user.id,
          refreshHash: `reset:${tokenHash}`,
          expiresAt,
        },
      });

      // TODO: Send email with reset link:
      // await emailService.send(email, 'Reset your password',
      //   `Click here: ${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`);
      console.log(`[DEV] Password reset token for ${email}: ${rawToken}`);
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  /** Validates the reset token and updates the password. */
  async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = this.tokens.hashRefresh(rawToken);
    const session = await this.prisma.session.findFirst({
      where: {
        refreshHash: `reset:${tokenHash}`,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedError('Reset token is invalid or expired');
    }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash },
      }),
      // Revoke the reset token and all existing sessions for security.
      this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password updated successfully. Please sign in.' };
  }

  private async issuePair(
    userId: bigint,
    role: 'admin' | 'user' | 'worker',
    email: string,
    meta: RequestMeta,
  ): Promise<TokenPair> {
    const accessToken = await this.tokens.signAccess({
      sub: userId.toString(),
      role,
      email,
    });

    const { token: refreshToken, hash } = this.tokens.createRefreshToken();
    await this.prisma.session.create({
      data: {
        userId,
        refreshHash: hash,
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt: new Date(Date.now() + this.tokens.refreshTtlMs()),
      },
    });

    return { accessToken, refreshToken };
  }
}

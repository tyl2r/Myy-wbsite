import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'node:crypto';
import { UserRole } from '../../generated/prisma';

export interface AccessClaims {
  sub: string;
  role: UserRole;
  email: string;
}

/**
 * Issues and verifies tokens. Access tokens are JWTs verified statelessly.
 * Refresh tokens are opaque random strings; only their SHA-256 hash is stored,
 * so a database leak does not expose usable tokens.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signAccess(claims: AccessClaims): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<number>('jwt.accessTtl'),
    });
  }

  /** Generates an opaque refresh token and its storage hash. */
  createRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(48).toString('base64url');
    return { token, hash: this.hashRefresh(token) };
  }

  hashRefresh(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  refreshTtlMs(): number {
    return (this.config.get<number>('jwt.refreshTtl') ?? 0) * 1000;
  }
}

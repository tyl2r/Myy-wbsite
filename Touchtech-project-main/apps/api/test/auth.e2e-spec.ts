import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';

/**
 * End-to-end auth flow against a real database (provided by CI services).
 * Verifies registration, login, refresh-token rotation, and that a rotated
 * (old) refresh token can no longer be reused.
 */
describe('Auth flow (e2e)', () => {
  let app: NestFastifyApplication;
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'sufficiently-long-password';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const inject = (url: string, payload: unknown) =>
    app.inject({ method: 'POST', url, payload });

  it('registers a new account and returns a token pair', async () => {
    const res = await inject('/api/v1/auth/register', {
      email,
      password,
      fullName: 'E2E User',
      role: 'user',
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
  });

  it('logs in and rotates the refresh token, rejecting reuse', async () => {
    const login = await inject('/api/v1/auth/login', { email, password });
    expect(login.statusCode).toBe(200);
    const { refreshToken } = login.json().data;

    const refreshed = await inject('/api/v1/auth/refresh', { refreshToken });
    expect(refreshed.statusCode).toBe(200);

    // The original refresh token is now revoked; reusing it must fail.
    const reuse = await inject('/api/v1/auth/refresh', { refreshToken });
    expect(reuse.statusCode).toBe(401);
  });

  it('rejects unauthenticated access to a protected route', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/users/me' });
    expect(res.statusCode).toBe(401);
  });
});

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { ConflictError, UnauthorizedError } from '../../common/errors/domain.error';
import * as argon2 from 'argon2';

/**
 * Focused unit tests for the auth service. Prisma and TokenService are stubbed
 * so the tests assert business behavior (enumeration resistance, rotation,
 * conflict handling) without a database.
 */
describe('AuthService', () => {
  const tokens = {
    signAccess: jest.fn().mockResolvedValue('access.jwt'),
    createRefreshToken: jest.fn().mockReturnValue({ token: 'raw', hash: 'h' }),
    hashRefresh: jest.fn((t: string) => `hash:${t}`),
    refreshTtlMs: jest.fn().mockReturnValue(1000),
  } as unknown as TokenService;

  function makePrisma(overrides: Record<string, any> = {}) {
    return {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      session: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      ...overrides,
    } as any;
  }

  it('rejects registration when the email already exists', async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ id: 1n });
    const service = new AuthService(prisma, tokens);

    await expect(
      service.register(
        { email: 'a@b.com', password: 'x'.repeat(10), fullName: 'A', role: 'user' },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects login with unknown email without leaking existence', async () => {
    const prisma = makePrisma();
    const service = new AuthService(prisma, tokens);

    await expect(
      service.login({ email: 'nobody@b.com', password: 'secret' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rotates the session on refresh', async () => {
    const prisma = makePrisma();
    prisma.session.findFirst.mockResolvedValue({
      id: 9n,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10_000),
      user: { id: 1n, role: 'user', email: 'a@b.com' },
    });
    const service = new AuthService(prisma, tokens);

    const pair = await service.refresh('raw', {});

    expect(prisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 9n } }),
    );
    expect(pair.accessToken).toBe('access.jwt');
  });

  it('hashes passwords with argon2id on registration', async () => {
    const prisma = makePrisma();
    prisma.user.create.mockResolvedValue({ id: 1n, role: 'user', email: 'a@b.com' });
    const service = new AuthService(prisma, tokens);

    await service.register(
      { email: 'a@b.com', password: 'longpassword', fullName: 'A', role: 'user' },
      {},
    );

    const created = prisma.user.create.mock.calls[0][0].data;
    expect(created.passwordHash).toMatch(/^\$argon2id\$/);
    await expect(argon2.verify(created.passwordHash, 'longpassword')).resolves.toBe(true);
  });
});

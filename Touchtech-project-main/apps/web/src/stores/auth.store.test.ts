import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API client so the store is tested in isolation.
vi.mock('@/lib/api/client', () => {
  const calls: Record<string, unknown[]> = {};
  return {
    api: {
      post: vi.fn(async (path: string) => {
        if (path === '/auth/refresh')
          return { data: { accessToken: 'a2', refreshToken: 'r2' } };
        if (path === '/auth/login')
          return { data: { accessToken: 'a1', refreshToken: 'r1' } };
        return { data: {} };
      }),
      get: vi.fn(async () => ({
        data: { id: '1', email: 'u@x.dev', fullName: 'U', role: 'user' },
      })),
    },
    configureClient: vi.fn(),
    __calls: calls,
  };
});

import { useAuth } from './auth.store';

describe('auth store', () => {
  beforeEach(() => {
    useAuth.setState({ user: null, accessToken: null, status: 'idle' });
  });

  it('logs in, stores the access token and loads the profile', async () => {
    await useAuth.getState().login('u@x.dev', 'password123');
    const state = useAuth.getState();
    expect(state.accessToken).toBe('a1');
    expect(state.user?.role).toBe('user');
    expect(state.status).toBe('authenticated');
  });

  it('refresh() rotates the access token and returns true', async () => {
    await useAuth.getState().login('u@x.dev', 'password123');
    const ok = await useAuth.getState().refresh();
    expect(ok).toBe(true);
    expect(useAuth.getState().accessToken).toBe('a2');
  });

  it('bootstrap() establishes a session via silent refresh', async () => {
    await useAuth.getState().login('u@x.dev', 'password123');
    await useAuth.getState().bootstrap();
    expect(useAuth.getState().status).toBe('authenticated');
    expect(useAuth.getState().user).not.toBeNull();
  });
});

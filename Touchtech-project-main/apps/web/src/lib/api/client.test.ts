import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, configureClient } from './client';
import { ApiError } from './envelope';

function mockFetchSequence(responses: Array<{ status: number; body?: unknown }>) {
  const fn = vi.fn();
  for (const r of responses) {
    fn.mockResolvedValueOnce({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
    });
  }
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('api client', () => {
  beforeEach(() => {
    configureClient({
      baseUrl: 'http://test/api/v1',
      getAccessToken: () => 'token-1',
      refresh: async () => false,
    });
  });

  it('unwraps the data envelope on success', async () => {
    mockFetchSequence([{ status: 200, body: { data: { ok: true } } }]);
    const res = await api.get<{ ok: boolean }>('/ping');
    expect(res.data).toEqual({ ok: true });
  });

  it('maps an error body to a typed ApiError', async () => {
    mockFetchSequence([
      { status: 409, body: { error: { code: 'CONFLICT', message: 'dupe' } } },
    ]);
    await expect(api.post('/things', {})).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
  });

  it('refreshes once on 401 and retries the original request', async () => {
    const fetchFn = mockFetchSequence([
      { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'expired' } } },
      { status: 200, body: { data: { recovered: true } } },
    ]);
    const refresh = vi.fn().mockResolvedValue(true);
    configureClient({ getAccessToken: () => 'token-1', refresh });

    const res = await api.get<{ recovered: boolean }>('/secure');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(res.data).toEqual({ recovered: true });
  });

  it('does not loop when refresh fails', async () => {
    mockFetchSequence([
      { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'expired' } } },
    ]);
    configureClient({ refresh: async () => false });
    await expect(api.get('/secure')).rejects.toBeInstanceOf(ApiError);
  });
});

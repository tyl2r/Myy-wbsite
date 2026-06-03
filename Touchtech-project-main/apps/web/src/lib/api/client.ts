import { ApiError, type Envelope } from './envelope';

/**
 * Typed fetch wrapper around the RouteShare API.
 *
 * Responsibilities:
 *  - attach the in-memory access token
 *  - unwrap the { data } envelope so callers get the payload directly
 *  - on 401, perform a single-flight refresh and retry the original request
 *
 * The refresh callback is injected by the auth store to avoid a circular import
 * and to keep the client free of store knowledge (testable in isolation).
 */
export interface ClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  refresh: () => Promise<boolean>;
}

let config: ClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '/api/v1',
  getAccessToken: () => null,
  refresh: async () => false,
};

export function configureClient(partial: Partial<ClientConfig>): void {
  config = { ...config, ...partial };
}

// Single-flight refresh: concurrent 401s share one refresh promise.
let refreshing: Promise<boolean> | null = null;

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshing) {
    refreshing = config.refresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Internal: prevents infinite retry loops. */
  _retried?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<Envelope<T>> {
  const url = new URL(
    config.baseUrl + path,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  );
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const token = config.getAccessToken();
  const res = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 401 && !opts._retried) {
    const ok = await ensureRefreshed();
    if (ok) return request<T>(path, { ...opts, _retried: true });
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { error?: { code: string; message: string; details?: unknown } }
      | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? res.statusText,
      body?.error?.details,
    );
  }

  if (res.status === 204) return { data: undefined as T };
  return (await res.json()) as Envelope<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
};

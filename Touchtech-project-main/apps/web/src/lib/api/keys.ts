/**
 * Central query-key factory. Every hook derives keys from here so cache
 * invalidation is consistent and refactor-safe.
 */
export const queryKeys = {
  me: ['me'] as const,
  requests: {
    all: ['requests'] as const,
    list: (status?: string) => ['requests', 'list', status ?? 'all'] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
  },
  batches: {
    nearby: (lat: number, lng: number) => ['batches', 'nearby', lat, lng] as const,
    mine: ['batches', 'mine'] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
    unread: ['notifications', 'unread'] as const,
  },
  admin: {
    metrics: ['admin', 'metrics'] as const,
    users: (role?: string) => ['admin', 'users', role ?? 'all'] as const,
    live: ['admin', 'live'] as const,
  },
};

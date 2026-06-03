import { http, HttpResponse } from 'msw';
import { demoUser, requests } from './fixtures';

const base = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

/**
 * REST mocks mirroring the backend envelope shape so the UI behaves identically
 * against mocks or the real API. A simulated tracking stream is provided by the
 * dev WS shim, not here.
 */
export const handlers = [
  http.post(`${base}/auth/login`, () =>
    HttpResponse.json({ data: { accessToken: 'mock.access', refreshToken: 'mock.refresh' } }),
  ),
  http.post(`${base}/auth/refresh`, () =>
    HttpResponse.json({ data: { accessToken: 'mock.access2', refreshToken: 'mock.refresh2' } }),
  ),
  http.get(`${base}/users/me`, () => HttpResponse.json({ data: demoUser })),

  http.get(`${base}/requests`, () =>
    HttpResponse.json({ data: requests, meta: { nextCursor: null } }),
  ),
  http.get(`${base}/requests/:id`, ({ params }) => {
    const found = requests.find((r) => r.id === params.id);
    return found
      ? HttpResponse.json({ data: found })
      : HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
  }),
  http.post(`${base}/requests`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      data: {
        id: String(2000 + Math.floor(Math.random() * 999)),
        status: 'created',
        priceCents: 740,
        distanceM: 3100,
        createdAt: new Date().toISOString(),
        ...body,
      },
    });
  }),

  // Worker endpoints
  http.get(`${base}/workers/me`, () =>
    HttpResponse.json({
      data: {
        userId: '3',
        verification: 'verified',
        vehicle: 'car',
        isAvailable: true,
        maxDetourPct: 15,
      },
    }),
  ),
  http.patch(`${base}/workers/me/availability`, async ({ request }) => {
    const body = (await request.json()) as { isAvailable: boolean };
    return HttpResponse.json({
      data: { userId: '3', verification: 'verified', vehicle: 'car', maxDetourPct: 15, ...body },
    });
  }),
  http.get(`${base}/batches/nearby`, () =>
    HttpResponse.json({
      data: Array.from({ length: 6 }).map((_, i) => ({
        id: String(1500 + i),
        pickup_lat: 59.329 + i * 0.002,
        pickup_lng: 18.068 + i * 0.002,
        dropoff_lat: 59.34 + i * 0.002,
        dropoff_lng: 18.08 + i * 0.002,
        distance_m: 600 + i * 250,
      })),
    }),
  ),
  http.get(`${base}/batches/me`, () =>
    HttpResponse.json({
      data: [
        {
          id: '900',
          status: 'active',
          createdAt: new Date().toISOString(),
          stopOrder: [
            { requestId: '1500', type: 'pickup', seq: 0 },
            { requestId: '1501', type: 'pickup', seq: 1 },
            { requestId: '1500', type: 'dropoff', seq: 2 },
            { requestId: '1501', type: 'dropoff', seq: 3 },
          ],
        },
      ],
    }),
  ),
  http.post(`${base}/batches`, async ({ request }) => {
    const body = (await request.json()) as { requestIds: string[] };
    return HttpResponse.json({ data: { batchId: '901', accepted: body.requestIds.length } });
  }),

  // Admin endpoints
  http.get(`${base}/admin/metrics`, () =>
    HttpResponse.json({
      data: {
        requestsByStatus: {
          created: 12, matched: 5, accepted: 8, in_transit: 9,
          delivered: 41, confirmed: 120, cancelled: 7, failed: 3,
        },
        activeWorkers: 12,
        fulfillmentRate: 0.94,
      },
    }),
  ),
  http.get(`${base}/admin/users`, ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const cursor = Number(url.searchParams.get('cursor') ?? 0);
    const all = Array.from({ length: 120 }).map((_, i) => ({
      id: String(1 + i),
      email: `member${i + 1}@routeshare.dev`,
      fullName: `Member ${i + 1}`,
      role: (['user', 'worker', 'admin'] as const)[i % 3],
      status: i % 7 === 0 ? 'suspended' : 'active',
      ratingAvg: (4 + (i % 10) / 10).toFixed(2),
      createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
    }));
    const filtered = role ? all.filter((u) => u.role === role) : all;
    const page = filtered.slice(cursor, cursor + 25);
    const next = cursor + 25 < filtered.length ? String(cursor + 25) : null;
    return HttpResponse.json({ data: page, meta: { nextCursor: next } });
  }),
  http.get(`${base}/admin/live`, () =>
    HttpResponse.json({
      data: Array.from({ length: 8 }).map((_, i) => ({
        batch_id: String(900 + i),
        worker_id: String(3 + i),
        lat: 59.329 + i * 0.004,
        lng: 18.068 + i * 0.004,
        at: new Date().toISOString(),
      })),
    }),
  ),
  http.patch(`${base}/admin/users/:id/status`, () => HttpResponse.json({ data: { ok: true } })),
  http.patch(`${base}/admin/workers/:id/verification`, () =>
    HttpResponse.json({ data: { ok: true } }),
  ),
];

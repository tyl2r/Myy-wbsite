# Frontend deployment

## Build from a fresh clone

```bash
git clone <repo> && cd <repo>/apps/web
pnpm install
cp .env.example .env.local   # edit values for your environment
pnpm build
pnpm start                   # serves the production build on :3000
```

For local development against the real backend, set `NEXT_PUBLIC_API_MOCKING`
to anything other than `enabled` and point `NEXT_PUBLIC_API_URL` /
`NEXT_PUBLIC_WS_URL` at the running API. To develop without a backend, leave
mocking `enabled` and MSW will serve fixtures.

## Environment variables

| Variable                     | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL`        | REST base URL (e.g. `/api/v1`)           |
| `NEXT_PUBLIC_WS_URL`         | Socket.IO origin for tracking            |
| `NEXT_PUBLIC_API_MOCKING`    | `enabled` to use MSW fixtures            |
| `NEXT_PUBLIC_MAP_STYLE_URL`  | MapLibre style/tile JSON URL             |
| `NEXT_PUBLIC_MAP_CENTER_*`   | Default map center                       |
| `NEXT_PUBLIC_MAP_ZOOM`       | Default map zoom                         |

None of these are secrets (all `NEXT_PUBLIC_`). The access token lives only in
memory; the refresh token is expected to be an httpOnly cookie set by the API.

## Recommended hosting

- **Vercel** — first-class Next.js App Router support, zero-config; set the env
  vars in the project dashboard. Best default.
- **Container (Docker) on any platform** — `next build` + `next start` behind a
  reverse proxy; suitable for GitLab/AWS/GCP. Use the standalone output for a
  slim image.
- **Static export is NOT suitable** — the app uses client data fetching and
  dynamic routes; deploy as a Node server or on Vercel.

## Pre-production checklist

- [ ] Commit a `pnpm-lock.yaml` and switch CI to `--frozen-lockfile`.
- [ ] Set a real `NEXT_PUBLIC_MAP_STYLE_URL` (demo tiles are not for production).
- [ ] Set `NEXT_PUBLIC_API_MOCKING` to disabled in all deployed environments.
- [ ] Confirm the API sets the refresh token as a secure, httpOnly cookie and
      CORS allows the web origin with credentials.
- [ ] Wire an error tracker in `app/error.tsx`.
- [ ] Run an automated a11y pass (axe) and Lighthouse budget in CI.
- [ ] Implement OpenAPI type generation to retire the hand-mirrored DTOs.
- [ ] Verify the production `next build` succeeds in CI once compute is available.

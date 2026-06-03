# RouteShare

Route-aware delivery-request platform connecting **users** who create delivery
requests, **workers** who fulfill them via route-optimized batching, and
**admins** who monitor the entire system in real time.

The core differentiator is **route-aware batching**: a worker accepts multiple
requests only when they fit a coherent route within a configurable detour
threshold, maximizing efficiency while keeping delivery cost low.

## Architecture

Monorepo with three deployable apps and shared packages.

```
routeshare/
├── apps/
│   ├── web/        # React + TypeScript frontend (Phase 4)
│   ├── api/        # NestJS (Fastify adapter) core service
│   └── tracking/   # Realtime GPS service (folds into api via WS gateway)
├── packages/
│   ├── shared-types/
│   └── config/
└── infra/          # docker, k8s, migrations
```

### Backend stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | NestJS on the Fastify adapter            |
| Language       | TypeScript                               |
| Database       | PostgreSQL + PostGIS                      |
| ORM            | Prisma                                    |
| Realtime       | Socket.IO gateway                         |
| Auth           | JWT access + rotating refresh tokens      |
| Hashing        | Argon2id                                  |
| Validation     | Zod                                       |
| Cache/presence | Redis                                     |

## Roles

- **User** — creates and tracks delivery requests.
- **Worker** — sees nearby requests, batch-accepts compatible ones, broadcasts GPS.
- **Admin** — monitors all activity live, manages users/workers, resolves disputes.

## Development

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
pnpm --filter api start:dev
```

## Project phases

1. Product & architecture plan
2. Database design (PostgreSQL + PostGIS)
3. **Backend implementation** ← current
4. Frontend implementation

## License

UNLICENSED — portfolio project.

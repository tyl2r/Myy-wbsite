# CI pipeline unification plan

Currently two separate `.gitlab-ci.yml` files exist on separate branches:
- `feat/backend-phase3` (MR !1): backend jobs (install, build, lint, prisma, unit, integration)
- `feat/frontend-phase4` (MR !2): frontend jobs (install, typecheck, lint, build, test)

They **will conflict on merge** since both target the same root file. This is the plan to unify them.

## Target structure

```yaml
# .gitlab-ci.yml (root, unified)
stages:
  - install
  - verify
  - test

include:
  - local: '.gitlab/ci/api.yml'   # backend jobs
  - local: '.gitlab/ci/web.yml'   # frontend jobs
```

Each app's jobs live in `.gitlab/ci/{app}.yml` with path-scoped `rules` so
only the relevant jobs run when files in that app change.

## Migration steps

1. **After both MRs merge to `main`**, resolve the conflict by:
   - Creating `.gitlab/ci/api.yml` with the backend job definitions.
   - Creating `.gitlab/ci/web.yml` with the frontend job definitions.
   - Replacing the root `.gitlab-ci.yml` with the `include:` stub above.
2. Verify both job sets still trigger with path-scoped `rules`.
3. Add a `web:openapi-drift` job once the OpenAPI workflow exists
   (see `docs/frontend-dto-generation.md`).

## Merge order recommendation

Merge !1 (backend) first, then !2 (frontend); resolve the frontend CI
conflict by adopting the `include:` pattern above so neither job set is lost.

## DTOs to be replaced by generated types

Once OpenAPI generation lands, these hand-maintained symbols in
`src/types/domain.ts` are replaced by generated equivalents:
`Role`, `RequestStatus`, `PackageSize`, `DeliveryRequest`, `WorkerProfile`,
`NearbyRequest`, `Batch`, `BatchStop`, `AdminMetrics`, `AdminUserRow`,
`LivePosition`, `SessionUser`. `LatLng` and pure UI types remain hand-owned.

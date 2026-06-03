# Frontend DTO type generation plan

Today `src/types/domain.ts` is a **hand-maintained mirror** of the backend
DTOs. That is acceptable while the API is small, but it can drift. This is the
plan to eliminate the manual mirror by generating types from the backend's
OpenAPI specification.

## Target approach

1. **Expose an OpenAPI document from the API.** Add `@nestjs/swagger` to
   `apps/api`, decorate DTOs/controllers, and emit `openapi.json` at build time
   (a `nest build` post-step or a dedicated `pnpm openapi:generate` script that
   boots the app in a doc-only mode and writes the spec to
   `apps/api/openapi.json`).

2. **Generate types in the web app.** Use `openapi-typescript` to turn the spec
   into a single `src/types/api.generated.ts`:

   ```bash
   pnpm openapi-typescript ../api/openapi.json -o src/types/api.generated.ts
   ```

   This yields a `paths` + `components['schemas']` tree with no runtime cost.

3. **Derive ergonomic aliases.** Re-export friendly names from the generated
   schema so feature code imports stable names rather than deep paths:

   ```ts
   import type { components } from './api.generated';
   export type DeliveryRequest = components['schemas']['RequestDto'];
   export type Role = components['schemas']['UserDto']['role'];
   ```

4. **Optionally generate a typed client.** `openapi-fetch` pairs with
   `openapi-typescript` to give a fully typed `GET/POST` client whose paths and
   bodies are checked against the spec, replacing the manual `api.get<T>()`
   generics with inferred types.

## Migration steps

1. Land Swagger decorators on the API; commit `openapi.json`.
2. Add `openapi:types` script + CI job in `apps/web` that regenerates and fails
   if `api.generated.ts` is out of date (drift guard).
3. Replace `domain.ts` symbols with re-exports from `api.generated.ts`,
   one module at a time.
4. Delete `domain.ts` once nothing imports it directly.

## CI integration

Add a `web:openapi-drift` job that runs the generator and `git diff --exit-code`
so a backend DTO change without a regenerated frontend type fails the pipeline.

## Known limitations (current pipeline)

- **No `pnpm-lock.yaml` is committed** for `apps/web` (or `apps/api`), so CI
  installs with `--no-frozen-lockfile`. Commit a generated lockfile and switch
  back to `--frozen-lockfile` for reproducible installs. This is the one
  outstanding gap before the pipeline is fully reproducible.
- Until OpenAPI generation lands, `domain.ts` must be updated by hand when
  backend DTOs change.

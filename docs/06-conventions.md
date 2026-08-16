# 06 — Conventions

> Last updated: 2026-08-16 (added: request-DTO/guard naming, error taxonomy additions, env/testing notes for Prisma)

## File and folder naming

Everything is **kebab-case**. Files carry a role suffix so the layer is readable from a search result or a stack trace.

| Suffix              | Used for                        | Example                          |
| ------------------- | ------------------------------- | --------------------------------- |
| `.entity.ts` / none | Domain entities                 | `greeting.ts`                     |
| `.repository.ts`    | Ports **and** their adapters    | `greeting.repository.ts`, `static-greeting.repository.ts` |
| `.use-case.ts`      | Use cases                       | `get-greeting.use-case.ts`        |
| `.dto.ts`           | Data transfer objects           | `greeting.dto.ts`                 |
| `.mapper.ts`        | Entity ⇄ DTO conversion         | `greeting.mapper.ts`              |
| `.module.ts`        | Nest modules                    | `greeting.module.ts`              |
| `.controller.ts`    | Nest controllers                | `greeting.controller.ts`          |
| `.container.ts`     | Frontend composition roots      | `landing.container.ts`            |
| `.request.ts`       | Backend: validated HTTP request bodies (`presentation/dto/`) | `create-user.request.ts` |
| `.guard.ts`         | Backend: Nest guards             | `jwt-auth.guard.ts`               |
| none (in `domain/services/`) | Domain-owned service ports (not repositories) | `password-hasher.ts`, `token.ts` |
| `.spec.ts`          | Unit tests, beside the subject  | `get-greeting.use-case.spec.ts`   |
| `.e2e-spec.ts`      | HTTP-level tests, in `test/`    | `app.e2e-spec.ts`                 |

Adapters are named after what they talk to: `static-greeting.repository.ts`, `prisma-user.repository.ts`, `bcrypt-password-hasher.ts`, `jwt-token.service.ts`.

A `domain/services/` port is for a capability that isn't data access — hashing, token signing — as opposed to `domain/repositories/`, which is specifically for persistence. Both get a paired `SCREAMING_SNAKE_CASE` DI token exported alongside the interface.

React components are kebab-case files exporting a PascalCase component: `greeting-hero.tsx` → `GreetingHero`.

Folder names are plural for collections (`entities/`, `use-cases/`, `components/`), singular for layers (`domain/`, `application/`).

## Naming in code

| Thing                    | Convention                         | Example                          |
| ------------------------ | ---------------------------------- | --------------------------------- |
| Types, interfaces, classes | PascalCase, no `I` prefix        | `GreetingRepository`              |
| Functions, variables      | camelCase                          | `toGreetingDto`                   |
| Constants and DI tokens   | SCREAMING_SNAKE_CASE               | `GREETING_REPOSITORY`             |
| Entity factories          | `create<Entity>`                   | `createGreeting`                  |
| Adapter factories         | `create<Adapter>`                  | `createStaticGreetingRepository`  |
| Use case factories (FE)   | `make<UseCase>`                    | `makeGetGreeting`                 |
| Use case classes (BE)     | `<Verb><Noun>UseCase`, one `execute` | `GetGreetingUseCase`            |

Use cases are named as commands or queries from the user's point of view — `GetGreeting`, `RegisterCustomer`, `CancelSubscription` — never after the mechanism (`FetchGreetingFromApi`).

## Imports

1. **Across the top level, use the `@/` alias**: `@/core`, `@/shared/ui/container`, `@/features/landing`. Both workspaces map `@/*` to their own `src/*`.
2. **Inside a feature, use relative paths**: `../../domain/entities/greeting`. The slice stays self-contained and can be moved.
3. **Import a feature only through its public API**: `@/features/landing`, never a deep path. Lint-enforced repo-wide on the backend — including one feature importing another, which is exactly the case that matters: see pattern 15 in [04-patterns](04-patterns.md#15-cross-cutting-guards-live-in-shared-not-inside-the-feature-that-issues-the-tokens) for a case where getting this wrong caused a circular `require()` at runtime.
4. **Inner layers import nothing outward.** No `react`, `next`, `@nestjs/*`, `express`, `rxjs`, `@/shared/**`, or any `infrastructure/`/`presentation/` path inside `core/`, `domain/`, or `application/`. Lint-enforced.
5. **Use `import type` for type-only imports.** It keeps runtime imports honest and avoids accidental cycles.
6. **A capability more than one feature needs — a guard, an interceptor — belongs in `shared/`, not in whichever feature happens to implement it first.** A feature depending on another feature for infrastructure that a third feature also needs is how cycles start.

## Exports

- **Named exports everywhere**, except where a framework demands a default: Next route files (`page.tsx`, `layout.tsx`, `icon.svg` conventions) and nothing else.
- **Barrels only at deliberate boundaries** — `core/index.ts` and `features/*/index.ts`. Do not add an `index.ts` per folder; it hides the layer a symbol came from and invites cycles.

## Errors

- Anything that can fail returns `Result<T, AppError>`. Do not throw across a layer boundary.
- Infrastructure converts foreign errors (`fetch` rejections, driver errors) into an `AppError` subclass before returning, attaching the original via `{ cause }`. Prefer matching a specific error code (e.g. Prisma's `P2002`) over a generic catch-all when the caller can meaningfully react differently — see pattern 17 in [04-patterns](04-patterns.md).
- The backend taxonomy is `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409), `UnauthorizedError` (401), `UnexpectedError` (500) — see [`app-error.ts`](../backend/src/core/domain/app-error.ts) and [`to-http-exception.ts`](../backend/src/shared/http/to-http-exception.ts).
- Only the outermost edge turns a failure into a user-visible thing: a component on the frontend, an HTTP status on the backend via `toHttpException`.
- Messages are written for humans and are safe to show; never put secrets or raw upstream payloads in them. A login failure always says "Invalid email or password" regardless of whether the email didn't exist or the password was wrong — never let a caller distinguish the two.

## Environment variables

- Read `process.env` **only** in `core/config/env.ts`. Everywhere else imports `env`.
- Every variable needs a sensible default there and a line in the workspace's `.env.example` and README table.
- Frontend variables exposed to the browser must be prefixed `NEXT_PUBLIC_` and written as full literals (`process.env.NEXT_PUBLIC_APP_NAME`) so Next can inline them. Anything without the prefix is server-only — keep secrets unprefixed.
- `.env*` files are gitignored except `.env.example`, which is committed.
- The backend's `env.ts` loads `dotenv/config` itself — Nest does not read `.env` files on its own. This is the one file allowed an import purely for that side effect.
- One documented exception to "read `process.env` only in `env.ts`": Prisma's generated client reads `DATABASE_URL` itself internally, and the Prisma CLI reads it from `prisma.config.ts` (which also does its own `dotenv/config`) — both are outside this project's code, not a rule violation.
- Prefer numeric env vars over ones with embedded units when a strict library type is involved — `JWT_EXPIRES_IN_SECONDS=3600` rather than `JWT_EXPIRES_IN=1h`, because `@nestjs/jwt`'s `expiresIn` wants `number | StringValue` (a branded literal type from `ms`), and a generic `string` isn't assignable to it without an unsafe cast.

## React and styling (frontend)

- **Server Components by default.** Add `"use client"` only at the leaf that needs interactivity, and keep no business rules in it.
- **Views fetch, components render.** A `presentation/views/*` file may call a use case; a `presentation/components/*` file takes props and nothing else.
- **Only DTOs cross into components** — plain, serializable data.
- **Tailwind utilities for styling.** No CSS modules, no inline `style` objects, no styled-components. Colors and fonts come from the tokens in `globals.css`; do not hard-code hex values in components.
- Compose conditional classes with `cn()` from `@/shared/lib/cn`.

## Tests

- Unit tests sit next to their subject as `*.spec.ts`, and target use cases and domain logic — the parts that are framework-free precisely so they are cheap to test.
- Dependencies in unit tests are hand-written fakes implementing the port. Reach for a mocking library only when a fake becomes genuinely unwieldy.
- HTTP-level tests live in `backend/test/*.e2e-spec.ts` and bootstrap `AppModule`, so they hit routes **without** the `/api` prefix that `main.ts` adds.
- Backend e2e tests need the database up (`npm run db:up -w backend`) — `PrismaService` connects eagerly on module init, so bootstrapping `AppModule` without a reachable Postgres fails the whole suite, not just the tests that touch data.
- An e2e test that creates data should generate a unique value (`randomUUID()` in an email, for instance) and clean up after itself, so the suite is safe to run repeatedly against a real, shared database rather than a fixture that gets reset.
- The frontend has no test runner yet; adding one is a decision to record in [08-decisions](08-decisions.md).

## Formatting

The two workspaces differ, and that is a known wrinkle:

- **Backend** — Prettier, enforced as an ESLint error. Run `npm run format -w backend` or `npm run lint:fix -w backend`.
- **Frontend** — no Prettier; `eslint-config-next` only. Keep to the surrounding style.

If this asymmetry starts causing noisy diffs, unify on Prettier at the root and record it as an ADR.

## TypeScript

- `strict: true` in both workspaces. Do not weaken it per-file.
- No `any`. Use `unknown` at untyped boundaries and narrow. (The backend preset disables the `no-explicit-any` rule; treat that as legacy configuration, not permission.)
- Prefer `readonly` fields on entities and DTOs — these are values, not mutable state.
- Do not use non-null assertions (`!`) to silence the compiler; handle the absent case.

## Git

- Small, focused commits; imperative subject line (`add customer repository port`).
- The working tree should pass typecheck, lint, and tests before you commit.
- Documentation updates ride along in the same commit as the change they describe — see the [update protocol](README.md#keeping-these-docs-current).

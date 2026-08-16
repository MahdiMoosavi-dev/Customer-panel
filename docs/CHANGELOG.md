# Changelog

> Last updated: 2026-08-16 (Postgres + Prisma, users CRUD, JWT auth)

One entry per working session, newest first. This is a log of **what changed in the project**, not a release changelog — it exists so the next person can see how the codebase got to its current shape without reading every commit.

**Format**

```markdown
## YYYY-MM-DD — Short title

**Changed** — what was added, removed, or reworked.
**Why** — the reason, if it is not obvious.
**Docs** — which docs were updated (or "none needed", and why).
**Verified** — the checks that were actually run.
```

---

## 2026-08-16 — Postgres + Prisma, users CRUD, JWT auth (backend only)

**Changed** — On a new `develop/backend` branch: added Postgres 17 via [`backend/docker-compose.yml`](../backend/docker-compose.yml); wired Prisma 7 as the ORM ([`prisma.config.ts`](../backend/prisma.config.ts), [`prisma/schema.prisma`](../backend/prisma/schema.prisma), one migration for a `users` table, [`PrismaService`](../backend/src/shared/prisma/prisma.service.ts) using the now-mandatory `@prisma/adapter-pg` driver adapter). Added a full `users` feature — entity + invariants, `UserRepository`/`PasswordHasher` ports, five CRUD use cases plus `VerifyUserCredentialsUseCase`, a Prisma-backed repository translating `P2002`/`P2025` to `ConflictError`/`NotFoundError`, `bcryptjs` hashing, `class-validator` request DTOs, a global `ValidationPipe`. Added an `auth` feature — `POST /auth/login` issuing a JWT via `@nestjs/jwt`. `GET /users` and `GET /users/:id` are now gated behind a new `JwtAuthGuard`. Extended `core/domain/app-error.ts` with `ConflictError`/`UnauthorizedError`. Tightened the backend's feature-privacy ESLint rule to apply repo-wide (it previously exempted files inside `features/`, so one feature could deep-import another's internals undetected).

**Why** — First real (persisted, protected) feature on the backend, requested as backend-only work while the frontend stays on hold. The `JwtAuthGuard` ended up living in `shared/http/` rather than `features/auth/` because the obvious placement caused a genuine circular `require()` at runtime (`InvalidDecoratorItemException` on boot) — not a style preference, a bug that was hit and fixed. Full account in [ADR-0012](08-decisions.md#adr-0012--the-jwt-guard-lives-in-shared-not-in-the-auth-feature).

**Docs** — [01-overview](01-overview.md) (what exists / gaps updated), [03-project-structure](03-project-structure.md) (backend tree), [04-patterns](04-patterns.md) (4 new patterns: cross-feature use cases, shared guards, request-DTO validation, Prisma error translation), [05-technologies](05-technologies.md) (new dependencies, a dedicated Prisma 7 section, two build/cache gotchas hit while wiring this up), [06-conventions](06-conventions.md) (naming, error taxonomy, env, testing notes), [07-workflows](07-workflows.md) (run the database, protect a route, 7 new troubleshooting rows), [08-decisions](08-decisions.md) (ADR-0012 through ADR-0016), `backend/README.md` (rewritten: setup, endpoint table, Prisma 7 and guard-placement explanations).

**Verified** — `npm run typecheck`, `lint`, `test` (8 unit), and `build` all pass on the backend; `test:e2e` (11 tests across 2 suites) passes against a live Postgres container; manually exercised the full flow with `curl` against the built app — create, duplicate-email 409, weak-password 400, unauthenticated 401, wrong-password login 401, successful login, authenticated list/get, patch, delete, post-delete 404, and confirmed `/greeting` still works.

---

## 2026-08-16 — Documentation set

**Changed** — Added `docs/` with the overview, architecture, project structure, patterns, technologies, conventions, workflows, and decision log, plus this changelog. Added a root `AGENTS.md` (imported by `CLAUDE.md`) carrying the working agreement and the documentation update protocol into every session. Linked the docs from the root `README.md`. Renamed `frontend/src/features/landing/domain/repositories/greeting-repository.ts` to `greeting.repository.ts` so the frontend matches the `name.role.ts` convention the rest of the codebase and the backend already used.

**Why** — The architecture is only worth having if the reasoning behind it survives past the session that built it. The rename was to make the documented naming convention true rather than aspirational.

**Docs** — This is the docs; [08-decisions](08-decisions.md) gained ADR-0011.

**Verified** — `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass.

---

## 2026-08-16 — Monorepo and NestJS backend

**Changed** — Converted the repository into an npm-workspaces monorepo: the Next.js app moved into `frontend/` untouched in structure, and a new NestJS 11 API was scaffolded in `backend/`. Root `package.json` now holds only scripts and the workspace list; a single hoisted `node_modules` and lockfile serve both. The backend received a `greeting` feature slice mirroring the frontend's layers, `GET /api/greeting`, the same two ESLint boundary rules (extended to ban `@nestjs/*` from inner layers), a unit test with a fake repository, and an e2e test. `@types/node` was aligned across workspaces to avoid a nested duplicate.

**Why** — The frontend needed an API of its own, and one repository keeps the two in step. NestJS was chosen so both sides share the same layering vocabulary — see [ADR-0006](08-decisions.md#adr-0006--nestjs-for-the-backend).

**Docs** — Predates this docs set; captured retroactively here and in [08-decisions](08-decisions.md) (ADR-0005 through ADR-0009).

**Verified** — Root `typecheck`, `lint`, `test` (2 unit + 1 e2e), and `build` pass; both production servers were started and confirmed serving — the API returns the greeting JSON and the page renders "Hello World".

---

## 2026-08-16 — Next.js foundation and the landing feature

**Changed** — Scaffolded Next.js 16 with TypeScript, Tailwind v4, ESLint, App Router and `src/`. Deleted the default template page and assets. Established `core/` (`Result`, `AppError`, `env`), `shared/` (`Container`, `cn`), and the first feature slice, `features/landing/`, built through all four layers to render a "Hello World" landing page. Added the two `no-restricted-imports` boundary rules and verified both fire.

**Why** — Establish the shape of the codebase with a walking skeleton before any real feature is written under time pressure.

**Docs** — Predates this docs set; captured retroactively here and in [08-decisions](08-decisions.md) (ADR-0001 through ADR-0004, ADR-0010).

**Verified** — `tsc --noEmit`, `eslint`, and `next build` pass; the page was confirmed rendering under both `next dev` and `next start`.

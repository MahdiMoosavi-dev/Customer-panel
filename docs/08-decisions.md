# 08 — Decisions

> Last updated: 2026-08-16 (added ADR-0012 through ADR-0016: users/auth on Postgres + Prisma 7 + JWT)

A log of choices that a future reader could reasonably question, so nobody has to re-litigate them from scratch — or, better, so they can overturn one on purpose, knowing what it was for.

**Format.** Each entry is dated, has a status (`Accepted`, `Provisional`, `Superseded`), and states the trade-off honestly. Provisional entries carry a **revisit trigger**: the observable event that should make someone reopen them.

**When you add one.** Any time you make a structural choice, pick a library, or deliberately accept a downside. Never edit an accepted decision's history — add a new ADR and mark the old one `Superseded by ADR-XXXX`.

---

## ADR-0001 — Next.js App Router, `src/`, TypeScript strict

`2026-08-16` · **Accepted**

**Context.** New frontend, no legacy constraints.

**Decision.** Next.js 16 with the App Router, code under `src/`, `strict: true`, Tailwind v4, `@/*` path alias.

**Consequences.** Server Components are the default, which fits the architecture well: a view can call a use case directly with no client-side data fetching. `src/` keeps app code away from the pile of config files at the workspace root.

---

## ADR-0002 — Feature slices with clean architecture inside each slice

`2026-08-16` · **Accepted**

**Context.** The alternative is grouping by technical type (`components/`, `services/`, `hooks/`), which spreads one product change across many folders.

**Decision.** Cut vertically by feature first, then horizontally into `domain / application / infrastructure / presentation` within each feature.

**Consequences.** A product change touches one folder. The cost is more files per feature — eleven for the "Hello World" slice — and a real learning curve for anyone who has not worked this way. Accepted because the intended lifetime of the app is long and the data sources are expected to change.

---

## ADR-0003 — Errors as values instead of exceptions

`2026-08-16` · **Accepted**

**Context.** Thrown exceptions are invisible in type signatures, so callers forget failure paths and errors surface as blank screens or 500s.

**Decision.** Anything that can fail returns `Result<T, AppError>`. Exceptions are reserved for truly unrecoverable situations, and for the HTTP edge where Nest's own machinery expects a throw.

**Consequences.** Every call site must narrow on `result.ok`, which is more ceremony. In exchange the compiler makes forgetting a failure path impossible, and failures can be mapped and forwarded like ordinary data.

---

## ADR-0004 — Enforce architectural boundaries with ESLint

`2026-08-16` · **Accepted**

**Context.** Documented layering rules erode under deadline pressure.

**Decision.** Encode two rules as `no-restricted-imports` in both workspaces: feature internals are private, and inner layers may not import outward or import frameworks.

**Consequences.** Violations fail `npm run lint` instead of passing review. Occasionally a legitimate case will trip a rule; the correct response is to change the rule deliberately and add an ADR, not to add an inline disable. Both rules were verified to actually fire when the scaffolding was built.

---

## ADR-0005 — npm workspaces without a task runner

`2026-08-16` · **Accepted**

**Context.** The repo needed two applications side by side. Options considered: npm workspaces alone, npm workspaces plus Turborepo, or pnpm workspaces.

**Decision.** npm workspaces alone. One root `package.json`, one lockfile, one hoisted `node_modules`, zero new tooling.

**Consequences.** `npm run build`, `lint`, `typecheck`, and `test` fan out with `--workspaces`. There is **no** root `dev` script, because npm runs workspace scripts sequentially and the first watcher would block the second — running both apps means two terminals. Build caching and parallel task graphs are not available.

**Revisit when** the check suite gets slow enough to notice, or a third or fourth workspace appears. Adding Turborepo later is additive and does not change the layout.

---

## ADR-0006 — NestJS for the backend

`2026-08-16` · **Accepted**

**Context.** Options considered were NestJS, Express, Fastify, and Hono. The frontend already had a layered, DI-shaped architecture.

**Decision.** NestJS 11 on the Express platform.

**Consequences.** Modules and a DI container map onto the layer model almost one-to-one, so the two applications read alike. The cost is a heavier dependency tree and more framework concepts than a bare router would need. Nest's ecosystem (validation pipes, guards, config, testing) covers most of what the missing pieces in [01-overview](01-overview.md) will need.

---

## ADR-0007 — Keep Nest decorators out of domain and application

`2026-08-16` · **Accepted**

**Context.** The common Nest idiom is `@Injectable()` on every service, including use cases. That couples business logic to the framework and pulls the Nest testing module into unit tests.

**Decision.** Use cases are plain classes. The feature module wires them with `useFactory` providers, and ports get a `Symbol` token declared beside the interface.

**Consequences.** Slightly more verbose module files. In exchange the application layer is framework-free — the same rule the frontend follows — and unit tests construct a use case with `new` and a hand-written fake, with no Nest bootstrap. It also keeps the "no frameworks in inner layers" lint rule enforceable on the backend.

---

## ADR-0008 — Duplicate `core/` primitives instead of a shared package

`2026-08-16` · **Provisional**

**Context.** `Result`, `AppError`, and the `env` pattern exist in both applications. Sharing them means a third workspace plus a build or transpile step for cross-package types, and a Next-vs-Nest module-format question.

**Decision.** Duplicate them for now, keeping the two copies deliberately identical in shape.

**Consequences.** Two files to change when a primitive changes, and a real risk of drift if nobody notices. Accepted because the primitives are small and stable, and because the alternative adds tooling before there is evidence it is needed.

**Revisit when** the duplicated surface grows beyond these primitives, the two copies diverge unintentionally, or a genuinely shared domain type appears. The fix is to add `packages/shared/` to `workspaces` in the root `package.json`.

---

## ADR-0009 — The frontend renders from a static adapter, not the API

`2026-08-16` · **Provisional**

**Context.** Wiring the landing page to `GET /api/greeting` would make the frontend dev server depend on the backend being up.

**Decision.** Ship the frontend with `createStaticGreetingRepository`, and document the swap.

**Consequences.** Each app runs standalone, which keeps onboarding trivial, but the integration between them is unproven at runtime. The swap is one line in the composition root — the recipe is in [07-workflows](07-workflows.md#connect-the-frontend-to-the-backend).

**Revisit when** the first real feature needs backend data — which is the moment the integration should be proven properly.

---

## ADR-0010 — Tailwind v4 with CSS-first tokens

`2026-08-16` · **Accepted**

**Context.** Tailwind v4 replaces `tailwind.config.js` with configuration in CSS.

**Decision.** Declare design tokens in an `@theme inline` block in `globals.css`; handle dark mode with a `prefers-color-scheme` media query over CSS custom properties.

**Consequences.** No JS config file to keep in sync, and tokens are visible where the styles are. A manual (user-toggled) theme switch is not possible without introducing a `data-theme` strategy, which is a small refactor if it becomes a requirement.

---

## ADR-0011 — Documentation is updated in the same session as the change

`2026-08-16` · **Accepted**

**Context.** Documentation that is updated "later" is not updated. Stale docs are worse than absent ones, because people trust them.

**Decision.** `docs/` is the reference for the project, and any session that changes part of the project updates the corresponding docs and adds a CHANGELOG entry before reporting the work done. The trigger table lives in [docs/README.md](README.md#keeping-these-docs-current); the root [AGENTS.md](../AGENTS.md) carries the rule into every agent session automatically.

**Consequences.** A small tax on every change, and the docs stay trustworthy enough to be worth reading. No automated enforcement exists yet — if compliance slips, a CI check on "docs changed when `src/` changed" is the next step.

---

## ADR-0012 — The JWT guard lives in `shared/`, not in the auth feature

`2026-08-16` · **Accepted**

**Context.** Building the first protected route (`GET /users`), the obvious design put `JwtAuthGuard` inside `features/auth/presentation/guards/`, alongside the port it depends on (`TokenService`) and its login use case. `UsersController` then imported it via `@/features/auth`. Separately, `auth`'s `LoginUseCase` needs `users`' `VerifyUserCredentialsUseCase`, so `AuthModule` imports `@/features/users`.

That closed a circular CommonJS `require()` loop: `users.controller.ts` → `auth/index.ts` → `auth.module.ts` → `users/index.ts` → `users.module.ts` → `users.controller.ts`. This is not hypothetical — it happened. `nest build` succeeded, but the running app crashed on boot: `InvalidDecoratorItemException: Invalid guard passed to @UseGuards() decorator (UsersController)`, because Node resolves a circular `require()` to whichever side of the cycle is still mid-evaluation, and `JwtAuthGuard` came back `undefined` at the point `@UseGuards(JwtAuthGuard)` ran. Marking `AuthModule` `@Global()` (to solve Nest's own DI-resolution circularity for the token) did not fix this — it's a plain JavaScript module-loading problem, one layer below anything Nest's DI container controls.

**Decision.** Recognize that a bearer-token guard was never really *auth business logic* — it's HTTP-layer plumbing any feature can attach, the same category as `to-http-exception.ts`. Move the **port** (`TokenService`, `TokenPayload`, `TOKEN_SERVICE`) to `core/domain/token.ts`, next to `Result`/`AppError`, and the **guard** to `shared/http/jwt-auth.guard.ts`. Only the **adapter** (`JwtTokenService`, the only file that knows a JWT is involved) stays inside `features/auth/infrastructure/`. `features/auth/` now has no `domain/` folder of its own — its one domain concept turned out to be cross-cutting.

**Consequences.** `users.controller.ts` now imports `@/shared/http/jwt-auth.guard`, never `@/features/auth` — the cycle cannot exist. Any future feature can `@UseGuards(JwtAuthGuard)` without importing `auth` at all, resolved through `AuthModule`'s global `TOKEN_SERVICE` binding. The cost is one asymmetry to remember: `auth`'s public API (`AuthModule`, `AuthTokenDto`) does not include the guard or the token type, which live one level up/over instead. Also tightened the backend's `no-restricted-imports` deep-feature-import rule to apply repo-wide (previously it exempted files *inside* `features/`, so feature-to-feature deep imports weren't caught) — see [04-patterns, pattern 15](04-patterns.md#15-cross-cutting-guards-live-in-shared-not-inside-the-feature-that-issues-the-tokens).

---

## ADR-0013 — JWT guard only on `GET /users` for now

`2026-08-16` · **Accepted**

**Context.** The task was specifically "clean pattern jwt auth for Get users." `POST /users` (registration), `PATCH /users/:id`, and `DELETE /users/:id` could reasonably also require authentication in a finished product.

**Decision.** Gate exactly `GET /users` and `GET /users/:id` behind `JwtAuthGuard`. `POST /users` stays open (it's the only way to create the first account — there is no separate admin-provisioning flow). `PATCH`/`DELETE` are left ungated, not because it's correct, but because scoping the guard to what was asked keeps the decision visible and easy to revisit, rather than silently guessing at a broader authorization model (which routes need which role, whether a user can only edit themselves, etc.) that hasn't been decided yet.

**Consequences.** Anyone who knows a user's `id` can currently update or delete that user without a token. This is a real, intentional gap — flagged in [01-overview](01-overview.md#what-is-deliberately-not-here-yet) and the endpoint table in `backend/README.md`, not silently shipped.

**Revisit when** the authorization model is decided — at minimum, whether `PATCH`/`DELETE` require the token to belong to the same user being modified, or a role check.

---

## ADR-0014 — Stay on the classic `prisma-client-js` generator

`2026-08-16` · **Accepted**

**Context.** Prisma 7's `prisma init` now defaults to `provider = "prisma-client"`, a new generator with a custom `output` path. Verified empirically (against a real Postgres 17 container, before writing any application code) that its generated `client.ts` opens with `import.meta.url` — valid only in ESM. This project's Nest build is CommonJS (`sourceType: 'commonjs'`, no `"type": "module"`), so that file cannot compile as-is; adopting it would mean converting the whole backend to ESM, a change with its own Nest/Jest/ts-node complications, undertaken as a side effect of a database task rather than a deliberate choice.

**Decision.** Keep the schema on `generator client { provider = "prisma-client-js" }` — the classic generator, which still emits CommonJS to the default `node_modules/@prisma/client` location. No custom `output` path needed.

**Consequences.** The driver-adapter requirement (see [`prisma.service.ts`](../backend/src/shared/prisma/prisma.service.ts)) applies to both generators equally — that part of the Prisma 7 change can't be avoided either way. Staying on the classic generator is lower-risk for this stack but is explicitly the *non-default* choice as of Prisma 7; revisit if a future Prisma release deprecates it, or if the backend ever moves to ESM for other reasons.

---

## ADR-0015 — `bcryptjs` over `bcrypt`

`2026-08-16` · **Accepted**

**Context.** The canonical `bcrypt` package ships a native addon requiring `node-gyp` and a C++ toolchain at install time, which can fail or slow down installs in constrained or sandboxed environments.

**Decision.** Use `bcryptjs`, a pure-JavaScript implementation with the same API shape, behind the feature's own `PasswordHasher` port — so the choice is contained to one adapter file ([`bcrypt-password-hasher.ts`](../backend/src/features/users/infrastructure/services/bcrypt-password-hasher.ts)) and trivially reversible.

**Consequences.** Slightly slower hashing than the native addon (immaterial at this scale — auth endpoints, not a hot loop) in exchange for zero native build dependencies. Swapping to `bcrypt` later is a one-file change behind the port, same as swapping any other adapter.

---

## ADR-0016 — Postgres via Docker Compose, not a hand-written Dockerfile

`2026-08-16` · **Accepted**

**Context.** The database is stock Postgres with no custom image requirements.

**Decision.** [`backend/docker-compose.yml`](../backend/docker-compose.yml) declares a single `db` service on the official `postgres:17-alpine` image, with a named volume and a healthcheck, configured entirely through environment variables (defaulted in the compose file, overridable via `backend/.env`). No custom `Dockerfile`.

**Consequences.** `npm run db:up` / `db:down` / `db:logs` are the whole interface; there is nothing to build or maintain beyond the compose file. If the database ever needs custom initialization (extensions, seed scripts) beyond what `postgres`'s official image's `/docker-entrypoint-initdb.d` convention covers, that is the trigger to add a `Dockerfile` that extends the base image.

# 08 — Decisions

> Last updated: 2026-08-16

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

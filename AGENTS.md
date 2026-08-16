# Working agreement — Customer Panel

Read this before changing anything. The full reference lives in [docs/](docs/README.md).

## What this repo is

An npm-workspaces monorepo with two applications that share one architecture — **feature slices, clean architecture inside each slice**:

- `frontend/` — Next.js 16, App Router, React 19, Tailwind v4
- `backend/` — NestJS 11, Express, Postgres 17 via Prisma 7 (`npm run db:up -w backend` before `dev:backend` — `PrismaService` connects eagerly)

## Rule 1 — Update the docs in the same session

**Any session that changes part of the project updates the documentation for that part before reporting the work as done.** Documentation is part of the change, not a follow-up task.

Minimum for every session that touches code:

1. Update the affected docs — the trigger table in [docs/README.md](docs/README.md#keeping-these-docs-current) says which file maps to which kind of change.
2. Add an entry to [docs/CHANGELOG.md](docs/CHANGELOG.md).
3. Bump the `Last updated` line on every doc you touched.
4. Add an ADR to [docs/08-decisions.md](docs/08-decisions.md) if you made a choice a future reader could reasonably question.

If you find a doc that contradicts the code while working on something else, fix it in that session.

## Rule 2 — Respect the layers

Dependencies point inward: `presentation → application → domain`, and `infrastructure → domain`.

- `domain/` and `application/` import **no** frameworks — no `react`, `next`, `@nestjs/*`, `express`, `rxjs` — and never reach into `infrastructure/`, `presentation/`, or `shared/`.
- Features are black boxes: import `@/features/<name>`, never a deep path.
- Each feature has exactly one composition root that knows which adapter backs which port.
- Anything that can fail returns `Result<T, AppError>` rather than throwing.
- A guard, interceptor, or pipe more than one feature needs belongs in `shared/`, never inside the feature that happens to implement it first — two features depending on each other through it is how you get a circular `require()` at boot. It happened once; see [ADR-0012](docs/08-decisions.md#adr-0012--the-jwt-guard-lives-in-shared-not-in-the-auth-feature).

These rules are enforced by `no-restricted-imports` in each workspace's `eslint.config.mjs`. If one blocks you, move the code or change the rule deliberately and record why — never add an inline disable.

Details and rationale: [docs/02-architecture.md](docs/02-architecture.md), [docs/04-patterns.md](docs/04-patterns.md).

## Rule 3 — Follow the existing shape

`features/landing/` (frontend) and `features/greeting/` (backend) are the reference *walking-skeleton* implementations — copy their layout, naming, and layering rather than inventing a new arrangement. `features/users/` + `features/auth/` (backend) are the reference for a real, persisted, protected feature and for how one feature depends on another. Conventions: [docs/06-conventions.md](docs/06-conventions.md). Recipes: [docs/07-workflows.md](docs/07-workflows.md).

## Commands

```bash
npm install              # from the root only, never inside a workspace
npm run db:up -w backend      # Postgres 17 in Docker — needed before dev:backend
npm run prisma:migrate -w backend
npm run dev:frontend     # :3000
npm run dev:backend      # :4000/api
npm run typecheck && npm run lint && npm test && npm run build
```

Install into one workspace with `npm install <pkg> -w frontend`.

## Environment notes

- `frontend/AGENTS.md` is generated and re-added by `next dev`. Leave it in place and commit it.
- The Next.js version's own documentation ships at `frontend/node_modules/next/dist/docs/`. Prefer it over recalled knowledge — this version has breaking changes.
- Backend `@/*` aliases are rewritten to relative requires by `nest build`, but Jest needs its own `moduleNameMapper` (both configs).
- Backend formatting is Prettier enforced through ESLint; the frontend has no Prettier.
- Prisma 7 is not the Prisma in most training data — no `datasource { url }` in `schema.prisma` (it's in `prisma.config.ts` instead), and `PrismaClient` now requires a driver adapter. Read [docs/05-technologies.md](docs/05-technologies.md#prisma-7--this-is-not-the-prisma-you-remember) before touching `prisma/` or `PrismaService`.
- Backend `test:e2e` needs the database up first (`npm run db:up -w backend`) — `PrismaService` connects on module init.

## Definition of done

```
[ ] npm run typecheck   passes
[ ] npm run lint        passes
[ ] npm test            passes
[ ] npm run build       passes
[ ] docs updated + CHANGELOG entry added
```

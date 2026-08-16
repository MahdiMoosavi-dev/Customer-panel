# Changelog

> Last updated: 2026-08-16

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

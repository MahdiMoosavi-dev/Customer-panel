# Customer Panel

npm-workspaces monorepo with two applications that share one architecture: **feature slices, clean architecture inside each slice**.

| Workspace                       | Stack                                        | Dev URL                 |
| ------------------------------- | -------------------------------------------- | ----------------------- |
| [frontend/](frontend/)          | Next.js 16 (App Router), React 19, Tailwind 4 | http://localhost:3000   |
| [backend/](backend/)            | NestJS 11, Express, Postgres 17 + Prisma 7    | http://localhost:4000/api |

## Getting started

```bash
npm install                      # once, at the root — installs both workspaces
cp backend/.env.example backend/.env

npm run db:up -w backend         # Postgres 17 in Docker
npm run prisma:migrate -w backend  # apply migrations

npm run dev:frontend   # terminal 1 → http://localhost:3000
npm run dev:backend    # terminal 2 → http://localhost:4000/api/greeting
```

The backend needs its database up before it will start — see [backend/README.md](backend/README.md#first-time-setup).

## Documentation

This README is the quick start. The reference lives in **[docs/](docs/README.md)**:

| Doc                                                  | Covers                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| [Overview](docs/01-overview.md)                      | What the app is, what exists today, what deliberately doesn't |
| [Architecture](docs/02-architecture.md)              | The four layers, the dependency rule, request flows           |
| [Project structure](docs/03-project-structure.md)    | Annotated trees and "where does this file go?"                |
| [Patterns](docs/04-patterns.md)                      | Ports & adapters, `Result`, DTOs, composition roots           |
| [Technologies](docs/05-technologies.md)              | Versions, why each tool, and its gotchas                      |
| [Conventions](docs/06-conventions.md)                | Naming, imports, errors, styling, tests                       |
| [Workflows](docs/07-workflows.md)                    | Recipes: add a feature, add an endpoint, swap an adapter      |
| [Decisions](docs/08-decisions.md)                    | ADR log — why things are the way they are                     |
| [Changelog](docs/CHANGELOG.md)                       | What each session changed                                     |

**Docs are updated in the same session as the code they describe** — the protocol is in [docs/README.md](docs/README.md#keeping-these-docs-current) and the working agreement in [AGENTS.md](AGENTS.md).

## Root scripts

| Script                    | Does                                                  |
| ------------------------- | ----------------------------------------------------- |
| `npm run dev:frontend`    | `next dev` in `frontend/`                             |
| `npm run dev:backend`     | `nest start --watch` in `backend/`                    |
| `npm run build`           | builds every workspace                                |
| `npm run lint`            | lints every workspace, including boundary rules       |
| `npm run typecheck`       | `tsc --noEmit` in every workspace                     |
| `npm test`                | runs every workspace's tests                          |
| `npm run start:frontend`  | serves the frontend production build                  |
| `npm run start:backend`   | runs `node dist/main` in `backend/`                   |

Target a single workspace directly with `-w`:

```bash
npm run lint -w backend
npm install zod -w frontend       # adds a dependency to one workspace only
```

Dependencies are hoisted to a single root `node_modules` with one `package-lock.json`.

## Layout

```
.
├── package.json          # workspace root: scripts only, no app code
├── frontend/             # Next.js app  → see frontend/README.md
│   └── src/
│       ├── app/          # routing layer, thin
│       ├── core/         # Result, AppError, env
│       ├── shared/       # ui/, lib/
│       └── features/landing/
│           ├── domain/ application/ infrastructure/ presentation/
│           └── index.ts  # the feature's public API
└── backend/              # NestJS API → see backend/README.md
    ├── docker-compose.yml   # Postgres 17 for local dev — `npm run db:up -w backend`
    ├── prisma/              # schema + migrations (Prisma 7 — see docs/05-technologies.md)
    └── src/
        ├── main.ts app.module.ts
        ├── core/         # Result, AppError, env, TokenService port
        ├── shared/       # http/ (error mapping, JwtAuthGuard), prisma/ (the one PrismaClient)
        └── features/     # greeting/ (reference), users/ (CRUD on Postgres), auth/ (JWT login)
            └── <name>/
                ├── domain/ application/ infrastructure/ presentation/
                └── index.ts  # the feature's public API
```

## The rules (both apps)

1. **Dependencies point inward.** `presentation → application → domain`, and `infrastructure → domain`. The domain imports nothing but `core`.
2. **Ports in, adapters out.** The domain declares the repository interface; infrastructure implements it. Swapping static content for a database or API touches one file.
3. **No frameworks in the inner layers.** `domain/` and `application/` never import `react`, `next`, or `@nestjs/*` — on the backend the use case is a plain class, wired by factory providers in the feature module.
4. **Entities stay inside.** Use cases return DTOs; controllers and components never see an entity.
5. **Features are black boxes.** Everything crosses `features/<name>/index.ts` — never a deep path.
6. **Errors are values.** Use cases return `Result<T, AppError>` instead of throwing; the backend translates that into a status code at the edge in [to-http-exception.ts](backend/src/shared/http/to-http-exception.ts).

Rules 1, 3, and 5 are enforced by `no-restricted-imports` in each workspace's `eslint.config.mjs`, so violations fail `npm run lint`.

## Known duplication

`core/` (`Result`, `AppError`, `TokenService`) exists in both apps. That is deliberate for now — sharing it means a third workspace and a build step for cross-package types. When the duplication starts to hurt, extract `packages/shared/` and add it to `workspaces` in the root [package.json](package.json).

The two apps are also not yet wired together: the frontend renders its greeting from its own static adapter, not from `GET /api/greeting`. To connect them, add an `HttpGreetingRepository` in `frontend/src/features/landing/infrastructure/repositories/` that fetches `NEXT_PUBLIC_API_URL` and swap the one line in [landing.container.ts](frontend/src/features/landing/infrastructure/di/landing.container.ts) — no other file changes. That is the whole point of the ports-and-adapters split.

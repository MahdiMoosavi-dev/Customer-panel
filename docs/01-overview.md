# 01 — Overview

> Last updated: 2026-08-16

## What this project is

**Customer Panel** is a customer-facing web application with its own HTTP API, built as a two-application monorepo:

- **`frontend/`** — a Next.js app that renders the panel the customer interacts with.
- **`backend/`** — a NestJS API that owns business rules and, in time, data.

Both applications are organized the same way: **feature slices, with clean architecture inside each slice**. One shape, two runtimes — so a developer who learns one side can read the other without re-learning anything.

## What the product does

> **To be filled in by the team.** The domain — what a customer manages in this panel, who the users are, what the core entities are — has not been specified in the repository yet. When it is, describe it here in a few paragraphs: the audience, the jobs they come to do, and the two or three nouns the system is really about. Everything else in these docs is structure; this section is the point of the structure.

## What exists today

The frontend is still the walking skeleton described below. The backend has grown past that: it now has a real, persisted domain (users) behind real authentication, developed on the `develop/backend` branch while the frontend is on hold.

**Frontend** — a landing page that renders `Hello World`:

- One feature slice, [`frontend/src/features/landing/`](../frontend/src/features/landing/), built through all four layers.
- The route file [`src/app/page.tsx`](../frontend/src/app/page.tsx) is three lines: it renders the feature's view and nothing else.
- Styling with Tailwind v4 tokens, light and dark, server-rendered with no client JavaScript of its own.

**Backend**:

- `GET /api/greeting` — the original walking-skeleton feature, unchanged.
- A `users` feature — full CRUD on a Postgres-backed `User` entity via Prisma, DTOs that never expose the password hash, and a `VerifyUserCredentialsUseCase` exported for other features to depend on (used by `auth`, without exposing the repository or hasher).
- An `auth` feature — `POST /auth/login` issues a JWT. `GET /users` and `GET /users/:id` are gated behind it via `JwtAuthGuard`. See [backend/README.md](../backend/README.md#the-jwt-guard-lives-in-shared-not-in-featuresauth) for why the guard lives in `shared/http/`, not inside `features/auth/`.
- A real database: Postgres 17 in Docker ([backend/docker-compose.yml](../backend/docker-compose.yml)), Prisma 7 as the ORM, one migration (`users` table).
- Request validation via `class-validator` DTOs and a global `ValidationPipe`.

**Tooling** — npm workspaces with one lockfile; TypeScript strict on both sides; ESLint with architecture boundary rules that fail the build on a layering violation; Jest unit + e2e tests on the backend (e2e now requires the database to be up, since `PrismaService` connects eagerly on module init).

### Why a "Hello World" feature is worth having

The `landing` and `greeting` slices are a **walking skeleton**: the thinnest possible feature that still travels through every layer, from the route or controller down to the entity and back. They exist to be copied. When you build the first real feature, you are not making architectural decisions under deadline pressure — you are following a path that already exists and is already enforced by lint.

Delete them once real features have taken over that role. Until then, keep them working: they are the executable version of these docs.

## What is deliberately not here yet

Knowing the gaps is as useful as knowing the contents. None of the following exists, and none of it is an oversight:

| Missing                          | Notes                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Authorization beyond "logged in" | The JWT guard proves a request carries a valid token; nothing yet checks roles, ownership, or permissions. `PATCH`/`DELETE /users/:id` are not gated at all — see [ADR-0013](08-decisions.md#adr-0013--jwt-guard-only-on-get-users-for-now). |
| Refresh tokens / logout          | `POST /auth/login` issues an access token only. No refresh flow, no revocation, no token blacklist.  |
| Frontend → backend wiring        | The frontend renders from its own static adapter, so it runs standalone. See [07-workflows](07-workflows.md#connect-the-frontend-to-the-backend). |
| A shared package                 | `core/` (`Result`, `AppError`, and now `TokenService`) is duplicated in both apps on purpose — see [ADR-0008](08-decisions.md#adr-0008--duplicate-core-primitives-instead-of-a-shared-package). |
| Frontend tests                   | The backend has Jest; the frontend has no test runner configured yet.                               |
| CI / CD, deployment, containers  | No pipeline beyond local Docker Compose for Postgres, no deployment environments.                    |
| Observability                    | Nest's default logger only. No metrics, tracing, or error reporting.                                |
| Rate limiting                    | `POST /auth/login` and `POST /users` have no throttling — brute-forcing credentials or spamming registrations is currently unmitigated. |

## Where to go next

- Adding your first real feature: [07 — Workflows](07-workflows.md)
- Understanding the layer model first: [02 — Architecture](02-architecture.md)
- Why things are the way they are: [08 — Decisions](08-decisions.md)

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

The foundation is complete and verified end to end; the product surface is one reference feature.

**Frontend** — a landing page that renders `Hello World`:

- One feature slice, [`frontend/src/features/landing/`](../frontend/src/features/landing/), built through all four layers.
- The route file [`src/app/page.tsx`](../frontend/src/app/page.tsx) is three lines: it renders the feature's view and nothing else.
- Styling with Tailwind v4 tokens, light and dark, server-rendered with no client JavaScript of its own.

**Backend** — one endpoint, `GET /api/greeting`:

- One feature slice, [`backend/src/features/greeting/`](../backend/src/features/greeting/), mirroring the frontend's layers exactly.
- Returns `{ "headline": "Hello World", "message": "Customer Panel API is up and running." }`.
- Unit-tested at the use-case level, plus an HTTP-level e2e test.

**Tooling** — npm workspaces with one lockfile; TypeScript strict on both sides; ESLint with architecture boundary rules that fail the build on a layering violation; Jest on the backend.

### Why a "Hello World" feature is worth having

The `landing` and `greeting` slices are a **walking skeleton**: the thinnest possible feature that still travels through every layer, from the route or controller down to the entity and back. They exist to be copied. When you build the first real feature, you are not making architectural decisions under deadline pressure — you are following a path that already exists and is already enforced by lint.

Delete them once real features have taken over that role. Until then, keep them working: they are the executable version of these docs.

## What is deliberately not here yet

Knowing the gaps is as useful as knowing the contents. None of the following exists, and none of it is an oversight:

| Missing                          | Notes                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Authentication / authorization   | No sessions, no users, no guards.                                                                   |
| A database                       | The only repository adapter returns static content. The port is ready; the adapter is not.          |
| Frontend → backend wiring        | The frontend renders from its own static adapter, so it runs standalone. See [07-workflows](07-workflows.md#connect-the-frontend-to-the-backend). |
| A shared package                 | `core/` (`Result`, `AppError`) is duplicated in both apps on purpose — see [ADR-0008](08-decisions.md#adr-0008--duplicate-core-primitives-instead-of-a-shared-package). |
| Frontend tests                   | The backend has Jest; the frontend has no test runner configured yet.                               |
| CI / CD, deployment, containers  | No pipeline, no Dockerfiles, no environments.                                                       |
| Observability                    | Nest's default logger only. No metrics, tracing, or error reporting.                                |
| Validation at the HTTP edge      | No `ValidationPipe`/schema validation yet — needed as soon as an endpoint accepts input.            |

## Where to go next

- Adding your first real feature: [07 — Workflows](07-workflows.md)
- Understanding the layer model first: [02 — Architecture](02-architecture.md)
- Why things are the way they are: [08 — Decisions](08-decisions.md)

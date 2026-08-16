# 02 — Architecture

> Last updated: 2026-08-16 (core/ now also has Paginated<T>, used by GET /users)

## The idea in one paragraph

The application is cut **vertically into features**, and each feature is cut **horizontally into four layers**. Business rules sit in the middle and know nothing about the outside world; frameworks, HTTP, React, and data sources sit at the edges and are replaceable. Dependencies only ever point inward. Both applications follow this identically.

## The layers

| Layer            | Answers                                | Contains                                                          | Must never contain                                       |
| ---------------- | -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| `domain/`        | What is true, always                   | Entities, value objects, invariants, repository **interfaces** (ports), DI tokens | React, Next, Nest, HTTP, SQL, `fetch`, any outer layer    |
| `application/`   | What the system does                   | Use cases, DTOs, mappers                                          | The same list — plus knowledge of *where* data comes from |
| `infrastructure/`| How the outside world is reached       | Repository implementations (adapters), API/DB clients, the composition root | UI, business rules                                        |
| `presentation/`  | How a human or client interacts        | React components and views (frontend), controllers (backend)      | Business rules, direct data access                        |

Two folders sit outside the features:

- **`core/`** — framework-agnostic primitives every feature may use: `Result`, `AppError`, `env`, and, on the backend, `Paginated<T>` for list endpoints. It is the innermost thing in the codebase and depends on nothing.
- **`shared/`** — reusable, feature-agnostic *outer-layer* code: UI primitives and helpers on the frontend (`shared/ui`, `shared/lib`), HTTP translation on the backend (`shared/http`). Unlike `core/`, `shared/` is allowed to know about the framework.

## The dependency rule

```
                    ┌──────────────────────────────┐
                    │        presentation          │   React components / Nest controllers
                    └──────────────┬───────────────┘
                                   │ calls
                    ┌──────────────▼───────────────┐
                    │        application           │   use cases, DTOs, mappers
                    └──────────────┬───────────────┘
                                   │ depends on
                    ┌──────────────▼───────────────┐
                    │           domain             │   entities + ports        ◄── nothing points out of here
                    └──────────────▲───────────────┘
                                   │ implements
                    ┌──────────────┴───────────────┐
                    │       infrastructure         │   adapters + composition root
                    └──────────────────────────────┘
```

Read the two arrows into `domain` carefully: `application` **depends on** the port, `infrastructure` **implements** it. Neither the use case nor the entity knows a static file, an HTTP call, or a database is on the other side. That inversion is the whole point — it is what makes the data source swappable and the use case testable.

## How a request flows

### Frontend — rendering the landing page

```
app/page.tsx                            route file, 3 lines
  └─ LandingView                        presentation — async Server Component
       └─ landingContainer.getGreeting()   infrastructure — composition root
            └─ getGreeting()                application — use case
                 └─ GreetingRepository      domain — port
                      └─ createStaticGreetingRepository()   infrastructure — adapter
                           └─ createGreeting()               domain — entity factory, enforces invariants
                 └─ toGreetingDto()          application — entity ➜ DTO
       └─ <GreetingHero greeting={dto} />  presentation — pure, props-only
```

If the use case returns a failure instead, `LandingView` renders `<GreetingError />`. Both branches are handled in one place; no component sees an exception.

### Backend — `GET /api/greeting`

```
main.ts                                  prefix, CORS, port
  └─ AppModule → GreetingModule          composition root wires token ➜ adapter ➜ use case
       └─ GreetingController.findCurrent()   presentation
            └─ GetGreetingUseCase.execute()   application
                 └─ GreetingRepository        domain — port (Symbol token)
                      └─ createStaticGreetingRepository()   infrastructure — adapter
                 └─ toGreetingDto()           application
            └─ ok ? DTO as JSON : toHttpException(error)   shared/http — status code at the edge
```

The controller is the only place in the backend that turns a domain failure into an HTTP status.

## Composition roots

Every feature has exactly one file that knows which concrete adapter backs which port. Nothing else does.

- **Frontend** — [`landing.container.ts`](../frontend/src/features/landing/infrastructure/di/landing.container.ts): a plain factory function; no DI framework needed.
- **Backend** — [`greeting.module.ts`](../backend/src/features/greeting/infrastructure/greeting.module.ts): a Nest module binding a `Symbol` token to an adapter and constructing the use case with a factory provider.

Swapping an implementation is a one-line edit in one file. That is the test of whether the architecture is actually working; if a swap ever requires touching `domain/`, `application/`, or `presentation/`, something has leaked.

## Feature boundaries

A feature is a black box. Its `index.ts` is the only door:

```ts
// frontend/src/features/landing/index.ts
export { LandingView } from "./presentation/views/landing-view";
export type { GreetingDto } from "./application/dto/greeting.dto";
```

Routes, root modules, and other features import `@/features/landing` — never `@/features/landing/presentation/views/landing-view`. Inside a feature, files use relative imports (`../../domain/entities/greeting`), which keeps the slice self-contained and movable.

## Enforcement

These are not honour-system rules. Both workspaces configure `no-restricted-imports` in their ESLint config, and violations fail `npm run lint`:

| Rule                                            | Where                                                            | Effect |
| ----------------------------------------------- | ---------------------------------------------------------------- | ------ |
| Feature internals are private                    | [frontend/eslint.config.mjs](../frontend/eslint.config.mjs), [backend/eslint.config.mjs](../backend/eslint.config.mjs) | Blocks `@/features/*/*` from outside the feature |
| Inner layers stay framework-free and inward-facing | same files                                                       | Blocks `**/infrastructure/**`, `**/presentation/**`, `react`, `next`, `@nestjs/*`, `express`, `rxjs`, `@/shared/**` from `core/`, `domain/`, `application/` |

Both rules were verified by writing deliberately violating files and confirming the lint errors, then deleting them.

## Honest trade-offs

- **It is more files than a small feature needs.** A "Hello World" costs eleven files. The bet is that the second and third real features cost less than they would have, because the shape is decided and the seams already exist.
- **The layering pays off exactly when adapters change** — static content becomes a database, a REST call becomes a queue, Nest becomes something else. If a slice will never see such a change, its inner layers can stay very thin; the folders are still worth keeping so the codebase reads uniformly.
- **The `Result` type costs ceremony at every call site.** In exchange, no caller can forget a failure path, because the type will not let them. See [ADR-0003](08-decisions.md#adr-0003--errors-as-values-instead-of-exceptions).

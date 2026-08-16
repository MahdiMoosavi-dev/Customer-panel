# @customer-panel/backend

NestJS 11 API, organized as **feature slices with clean architecture**. Part of the [Customer Panel monorepo](../README.md) — run `npm install` at the repo root, not here.

## Commands

```bash
npm run dev:backend -w ..     # or, from this folder:
npm run start:dev             # watch mode → http://localhost:4000/api
npm run build                 # nest build → dist/
npm run start:prod            # node dist/main
npm run lint                  # eslint, including architecture boundary rules
npm run typecheck             # tsc --noEmit
npm test                      # unit tests (jest)
npm run test:e2e              # http-level tests (supertest)
```

## Endpoints

| Method | Path            | Returns                                    |
| ------ | --------------- | ------------------------------------------ |
| `GET`  | `/api/greeting` | `{ "headline": "...", "message": "..." }`  |

## Structure

```
src/
├── main.ts                                   # bootstrap: prefix, CORS, port
├── app.module.ts                             # composes feature modules, no logic
├── core/                                     # framework-agnostic primitives
│   ├── config/env.ts                         # env vars read and defaulted once
│   ├── domain/result.ts                      # Result<T, E> — errors as values
│   ├── domain/app-error.ts                   # AppError hierarchy
│   └── index.ts                              # public API → "@/core"
├── shared/
│   └── http/to-http-exception.ts             # AppError code → HTTP status
└── features/greeting/
    ├── domain/                               # entities + ports, no Nest
    │   ├── entities/greeting.ts
    │   └── repositories/greeting.repository.ts   # interface + DI token
    ├── application/                          # orchestration, no Nest
    │   ├── dto/greeting.dto.ts
    │   ├── mappers/greeting.mapper.ts
    │   ├── use-cases/get-greeting.use-case.ts
    │   └── use-cases/get-greeting.use-case.spec.ts
    ├── infrastructure/
    │   ├── repositories/static-greeting.repository.ts
    │   └── greeting.module.ts                # composition root
    ├── presentation/
    │   └── controllers/greeting.controller.ts
    └── index.ts                              # public API → "@/features/greeting"
```

`@/*` maps to `src/*`; the Nest CLI rewrites the alias to relative requires at build time, so `node dist/main` needs no loader.

## Dependency injection without polluting the domain

An interface cannot be a DI token, so the domain exports a `Symbol` alongside it:

```ts
export interface GreetingRepository { ... }
export const GREETING_REPOSITORY = Symbol('GreetingRepository');
```

The feature module — the only Nest-aware file in the wiring path — binds the token to an adapter and constructs the use case with a factory. That is why `GetGreetingUseCase` needs no `@Injectable()` and can be unit-tested with a hand-written fake, as in [get-greeting.use-case.spec.ts](src/features/greeting/application/use-cases/get-greeting.use-case.spec.ts).

## Errors

Use cases return `Result<T, AppError>` rather than throwing. The controller is the single place that converts a failure into transport terms via `toHttpException`, which maps `VALIDATION_ERROR → 400`, `NOT_FOUND → 404`, and anything else to `500`.

## Adding a feature

```
src/features/<name>/
  domain/         entities, value objects, repository interfaces + tokens
  application/    use cases, DTOs, mappers
  infrastructure/ repository implementations, clients, <name>.module.ts
  presentation/   controllers
  index.ts        export the module and whatever types callers need
```

Then add the module to `imports` in [app.module.ts](src/app.module.ts).

## Configuration

See [src/core/config/env.ts](src/core/config/env.ts) and [.env.example](.env.example).

| Variable      | Default                 |
| ------------- | ----------------------- |
| `PORT`        | `4000`                  |
| `API_PREFIX`  | `api`                   |
| `APP_NAME`    | `Customer Panel`        |
| `CORS_ORIGIN` | `http://localhost:3000` |

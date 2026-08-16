# @customer-panel/frontend

Next.js 16 (App Router, TypeScript, Tailwind CSS v4) organized as **feature slices with clean architecture** inside each slice. Part of the [Customer Panel monorepo](../README.md) — run `npm install` at the repo root, not here.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build      # production build (also typechecks)
npm run lint       # eslint, including architecture boundary rules
npm run typecheck  # tsc --noEmit
```

## Structure

```
src/
├── app/                                  # routing layer only — thin, no business logic
│   ├── layout.tsx                        # root layout
│   ├── page.tsx                          # renders <LandingView />
│   ├── icon.svg
│   └── globals.css
├── core/                                 # cross-cutting primitives, framework-agnostic
│   ├── config/env.ts                     # env vars read and defaulted in one place
│   ├── domain/result.ts                  # Result<T, E> — errors as values
│   ├── domain/app-error.ts               # AppError hierarchy
│   └── index.ts                          # public API → import from "@/core"
├── shared/                               # reusable, feature-agnostic
│   ├── ui/container.tsx
│   └── lib/cn.ts
└── features/
    └── landing/
        ├── domain/                       # entities + ports; knows nothing else
        │   ├── entities/greeting.ts      # invariants live in the factory
        │   └── repositories/greeting-repository.ts
        ├── application/                  # orchestration; depends only on domain
        │   ├── dto/greeting.dto.ts
        │   ├── mappers/greeting.mapper.ts
        │   └── use-cases/get-greeting.use-case.ts
        ├── infrastructure/               # adapters + wiring
        │   ├── repositories/static-greeting.repository.ts
        │   └── di/landing.container.ts   # composition root
        ├── presentation/                 # React components; consume DTOs
        │   ├── components/greeting-hero.tsx
        │   ├── components/greeting-error.tsx
        │   └── views/landing-view.tsx
        └── index.ts                      # public API → import from "@/features/landing"
```

## The rules

1. **Dependencies point inward.** `presentation → application → domain`, and `infrastructure → domain`. The domain imports nothing but `@/core`.
2. **Ports in, adapters out.** The domain declares `GreetingRepository`; infrastructure implements it. Swapping static content for an API or database touches one file.
3. **No frameworks in the inner layers.** `domain/` and `application/` never import `react` or `next`, which keeps them plain-TypeScript testable.
4. **Entities stay inside.** Use cases return DTOs; components never see an entity.
5. **Features are black boxes.** Cross-feature and route imports go through `features/<name>/index.ts` — never a deep path.
6. **Errors are values.** Use cases return `Result<T, AppError>` instead of throwing, so every caller handles both branches.

Rules 1, 3, and 5 are enforced by `no-restricted-imports` in [eslint.config.mjs](eslint.config.mjs), so a violation fails `npm run lint`.

## Adding a feature

```
src/features/<name>/
  domain/         entities, value objects, repository interfaces
  application/    use cases, DTOs, mappers
  infrastructure/ repository implementations, API clients, di/<name>.container.ts
  presentation/   components, views, hooks
  index.ts        export only what the outside world may use
```

Then add a route in `src/app/` that renders the feature's view, keeping the route file a few lines long.

## How the request flows

`app/page.tsx` → `LandingView` → `landingContainer.getGreeting()` → `makeGetGreeting` → `GreetingRepository` port → `createStaticGreetingRepository` adapter → `createGreeting` entity factory, then back out as a `GreetingDto` rendered by `GreetingHero`.

## Talking to the backend

The landing feature currently reads from a static adapter, so it runs without the API. To source it from `GET /api/greeting` instead, add an `HttpGreetingRepository` next to the static one and swap the single line in [landing.container.ts](src/features/landing/infrastructure/di/landing.container.ts). Nothing in `domain/`, `application/`, or `presentation/` changes.

## Configuration

Optional environment variables (see [src/core/config/env.ts](src/core/config/env.ts) and [.env.example](.env.example)):

| Variable                      | Default                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_NAME`        | `Customer Panel`                                             |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `A Next.js starter with a feature-based clean architecture.` |
| `NEXT_PUBLIC_API_URL`         | unused until you wire in the HTTP adapter above              |

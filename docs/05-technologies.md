# 05 — Technologies

> Last updated: 2026-08-16
> Versions below are what is installed in `package-lock.json` as of this date. Re-check with `npm ls <pkg>` before relying on them.

## Runtime and tooling

| Tool           | Version in use | Notes                                                                 |
| -------------- | -------------- | ---------------------------------------------------------------------- |
| Node.js        | 22.18.0        | Root `package.json` declares `engines.node >= 20.11`.                   |
| npm            | 11.14.1        | Workspaces feature is what makes the monorepo work — no extra tooling.  |
| TypeScript     | 5.9.3          | `strict: true` in both workspaces.                                      |
| ESLint         | 9.39.5         | Flat config (`eslint.config.mjs`) in both workspaces.                   |

## Frontend — `@customer-panel/frontend`

| Package                | Version | Why it is here                                                        |
| ---------------------- | ------- | ---------------------------------------------------------------------- |
| `next`                 | 16.3.1  | App Router, React Server Components, file-system routing, build tooling |
| `react` / `react-dom`  | 19.2.8  | Required by Next 16                                                     |
| `tailwindcss`          | 4.3.3   | Utility CSS; v4 is configured in CSS, not JS                            |
| `@tailwindcss/postcss` | 4.3.3   | The PostCSS plugin Tailwind v4 ships as                                 |
| `eslint-config-next`   | 16.3.1  | Core-web-vitals + TypeScript presets                                    |

### Next.js 16 things worth knowing

- **Turbopack is the default bundler** for both `next dev` and `next build`.
- **Request APIs are async.** `params`, `searchParams`, `cookies()`, and `headers()` return promises and must be awaited.
- **Route prop helpers are global and generated.** `PageProps<'/blog/[slug]'>` and `LayoutProps<'/'>` need no import — see [`src/app/layout.tsx`](../frontend/src/app/layout.tsx). They are produced by `next dev`, `next build`, or `next typegen`; if your editor cannot find them, run one of those.
- **`middleware.ts` is now `proxy.ts`.** Relevant when adding auth or redirects.
- **The version's own docs ship with the package**, at `frontend/node_modules/next/dist/docs/`. That is the authoritative reference for this exact version — prefer it over anything remembered or found online.
- **`frontend/AGENTS.md` is generated and re-added by `next dev`.** Do not delete it; committing it keeps the tree clean.

### Tailwind v4 things worth knowing

- **No `tailwind.config.js`.** Configuration is CSS-first: [`src/app/globals.css`](../frontend/src/app/globals.css) does `@import "tailwindcss"` and declares design tokens in an `@theme inline` block.
- Tokens defined there become utilities automatically — `--color-foreground` gives you `text-foreground`, `bg-foreground`, and so on.
- Dark mode is handled with a `prefers-color-scheme` media query redefining the CSS custom properties, so no class-toggling machinery exists yet. Adding a manual theme switch means introducing a `data-theme` attribute strategy.

## Backend — `@customer-panel/backend`

| Package                    | Version | Why it is here                                              |
| -------------------------- | ------- | ------------------------------------------------------------ |
| `@nestjs/common` / `core`  | 11.2.1  | Module system and DI container                               |
| `@nestjs/platform-express` | 11.2.1  | HTTP adapter                                                 |
| `express`                  | 5.2.1   | Pulled in by the platform adapter                            |
| `reflect-metadata`         | 0.2.2   | Required by Nest's decorator metadata                        |
| `rxjs`                     | 7.8.2   | A Nest peer dependency; not used in application code         |
| `@nestjs/cli`              | 11.0.24 | `nest build`, `nest start --watch`, schematics               |
| `jest` / `ts-jest`         | 30.4.2 / 29.4.12 | Unit and e2e test runner                            |
| `supertest`                | 7.2.2   | HTTP assertions in e2e tests                                 |
| `prettier`                 | 3.9.6   | Formatting, enforced through `eslint-plugin-prettier`        |
| `typescript-eslint`        | 8.67.0  | Type-aware linting (`recommendedTypeChecked`)                |

### NestJS things worth knowing

- **Path aliases work at runtime.** `@/*` → `src/*` is declared in `tsconfig.json`, and the Nest CLI rewrites those specifiers to relative `require`s during `nest build` — verified by inspecting `dist/`. Plain `node dist/main` needs no loader or `tsconfig-paths` registration.
- **Jest does not share that rewriting.** Both Jest configs need `moduleNameMapper` for `@/`: the unit config in `package.json` (`<rootDir>/$1`, where `rootDir` is `src`) and `test/jest-e2e.json` (`<rootDir>/../src/$1`, because its `rootDir` resolves to `test/`).
- **The global prefix is set in `main.ts`, not in modules.** So routes are `/api/greeting` at runtime, but `/greeting` inside e2e tests that bootstrap `AppModule` directly.
- **Formatting is part of linting.** `eslint-plugin-prettier` reports format drift as an ESLint error; `npm run format` fixes it. The frontend does not have Prettier — see [06-conventions](06-conventions.md#formatting).

## Monorepo

- **npm workspaces**, declared in the root [`package.json`](../package.json). One hoisted `node_modules`, one `package-lock.json`.
- **No Turborepo or Nx.** Chosen deliberately — see [ADR-0005](08-decisions.md#adr-0005--npm-workspaces-without-a-task-runner). Root scripts fan out with `--workspaces`, and `-w <dir>` targets one app.
- **Keep shared dev dependency versions aligned across workspaces.** `@types/node` was pinned to the same major in both so npm hoists a single copy; a mismatch silently creates a nested duplicate and two versions of the Node type definitions.

## Adding a dependency

```bash
npm install <pkg> -w frontend        # runtime dependency in one workspace
npm install -D <pkg> -w backend      # dev dependency in one workspace
```

Never install into a workspace by `cd`-ing into it; always use `-w` from the root so the single lockfile stays correct. Then record what you added and why in this file, and add a CHANGELOG entry.

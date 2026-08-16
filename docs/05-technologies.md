# 05 — Technologies

> Last updated: 2026-08-16 (added: Prisma 7 + Postgres 17, JWT, bcryptjs, class-validator)
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
| `prisma` (CLI, dev)        | 7.9.1   | `migrate`, `generate`, `studio` — see the Prisma 7 section below |
| `@prisma/client`           | 7.9.1   | Generated ORM client                                          |
| `@prisma/adapter-pg`       | 7.9.1   | Driver adapter Prisma 7 now requires — wraps `pg`             |
| `pg`                       | 8.23.0  | node-postgres, the actual driver underneath the adapter        |
| `@nestjs/jwt`               | 11.0.2  | Thin wrapper over `jsonwebtoken`; used only inside `JwtTokenService` |
| `bcryptjs`                  | 3.0.3   | Password hashing — pure JS, chosen over `bcrypt` to skip native compilation; see [ADR-0015](08-decisions.md#adr-0015--bcryptjs-over-bcrypt) |
| `class-validator` / `class-transformer` | 0.15.1 / 0.5.1 | Decorator-based validation for `presentation/dto/*.request.ts`, enforced by a global `ValidationPipe` |
| `dotenv`                    | 17.4.2  | Loaded once, inside `core/config/env.ts`                       |

### NestJS things worth knowing

- **Path aliases work at runtime.** `@/*` → `src/*` is declared in `tsconfig.json`, and the Nest CLI rewrites those specifiers to relative `require`s during `nest build` — verified by inspecting `dist/`. Plain `node dist/main` needs no loader or `tsconfig-paths` registration.
- **A stray root-level `.ts` file can break that rewriting's output path.** Adding `prisma.config.ts` at the backend root (sibling to `src/`) made `nest build`'s inferred `rootDir` widen from `src/` to the project root, so output nested under `dist/src/main.js` instead of `dist/main.js` and `start:prod` (`node dist/main`) broke. Fixed by pinning `rootDir: "src"` and excluding `prisma.config.ts` / `prisma/**` in [`tsconfig.build.json`](../backend/tsconfig.build.json). If a build ever changes its output shape unexpectedly, suspect a new root-level file first.
- **A stale `tsconfig.build.tsbuildinfo` can make `nest build` silently emit nothing.** It's `incremental`-mode's cache, written to the *backend root* (not into `dist/`), so `rm -rf dist` does not clear it — and a structural tsconfig change (like the `rootDir` fix above) can leave it believing the project is already built. If `nest build` reports success but `dist/` is missing or stale, delete `backend/tsconfig.build.tsbuildinfo` and rebuild. It's already covered by the root `.gitignore`'s `*.tsbuildinfo` pattern.
- **Jest does not share that rewriting.** Both Jest configs need `moduleNameMapper` for `@/`: the unit config in `package.json` (`<rootDir>/$1`, where `rootDir` is `src`) and `test/jest-e2e.json` (`<rootDir>/../src/$1`, because its `rootDir` resolves to `test/`).
- **The global prefix is set in `main.ts`, not in modules.** So routes are `/api/greeting` at runtime, but `/greeting` inside e2e tests that bootstrap `AppModule` directly.
- **Formatting is part of linting.** `eslint-plugin-prettier` reports format drift as an ESLint error; `npm run format` fixes it. The frontend does not have Prettier — see [06-conventions](06-conventions.md#formatting).
- **A class passed to `@UseGuards()` needs its own dependencies resolvable from the controller's module.** Nest can instantiate an unregistered guard class ad hoc, but it still resolves that guard's constructor dependencies (e.g. `@Inject(TOKEN_SERVICE)`) through the injector of the module the controller lives in. That resolves here only because `AuthModule` — which binds `TOKEN_SERVICE` — is `@Global()`.

### Prisma 7 — this is not the Prisma you remember

Prisma 7 shipped after most recalled knowledge of Prisma was formed and changed enough to break it outright. Confirmed empirically against a real Postgres 17 container before writing any application code — do the same before trusting anything below against a different point release.

- **`datasource { url }` in `schema.prisma` is a hard error, not a deprecation.** `url = env("DATABASE_URL")` fails schema validation (`P1012`) with a message pointing at [`prisma.config.ts`](../backend/prisma.config.ts) instead. The CLI (`migrate`, `generate`, `studio`) now reads `DATABASE_URL` from that file's `datasource.url` field.
- **The runtime client requires a driver adapter — always, regardless of generator.** `new PrismaClient()` with no arguments throws; `PrismaClientOptions` is now `PrismaClientOptionsWithAdapter | PrismaClientOptionsWithAccelerateUrl`, and `adapter` is required in the former. [`PrismaService`](../backend/src/shared/prisma/prisma.service.ts) passes `new PrismaPg({ connectionString: env.databaseUrl })`.
- **The new default generator (`provider = "prisma-client"`) emits ESM-only code.** Its `client.ts` opens with `import.meta.url`, which cannot compile under this project's CommonJS Nest build. This project deliberately stays on the classic `provider = "prisma-client-js"` generator, which still outputs to `node_modules/@prisma/client` in CommonJS and needs no custom `output` path. See [ADR-0014](08-decisions.md#adr-0014--stay-on-the-classic-prisma-client-js-generator).
- **`prisma migrate dev` does not print a "Generated Prisma Client" confirmation the way `prisma generate` does**, and in this project's first run it genuinely hadn't regenerated the client — `npm run prisma:generate` had to be run explicitly afterward. If types look stale after a schema change, run it.
- **`prisma.config.ts` is loaded by the CLI's own bundler**, not by this project's `tsconfig.json` / `ts-node`, so it can use `import`/`export default` regardless of the backend's CommonJS module setting.

## Local database

- **Postgres 17**, via [`backend/docker-compose.yml`](../backend/docker-compose.yml) — `npm run db:up` / `db:down` / `db:logs` (from `backend/`, or `-w backend` from the root).
- A single `db` service, a named volume for persistence, credentials from `backend/.env` (`POSTGRES_USER`/`PASSWORD`/`DB`/`PORT`, all defaulted in the compose file too).
- Not committed: `backend/.env` (gitignored; copy from `.env.example`). `docker-compose.yml` itself is committed — it has no secrets, only variable references with defaults.

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

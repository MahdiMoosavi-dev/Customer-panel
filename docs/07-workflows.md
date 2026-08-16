# 07 — Workflows

> Last updated: 2026-08-16 (added: run the database, protect a route with JWT, Prisma/build troubleshooting)

Step-by-step recipes for the things you will actually do. All commands run from the **repo root** unless stated otherwise.

---

## First-time setup

```bash
npm install                      # installs both workspaces into one hoisted node_modules
cp frontend/.env.example frontend/.env.local     # optional; defaults work without it
cp backend/.env.example backend/.env             # do this one — the database needs its values
```

## Run the database (backend only, but required before `dev:backend`)

```bash
npm run db:up -w backend         # Postgres 17 in Docker, via docker-compose.yml
npm run prisma:migrate -w backend  # applies backend/prisma/migrations/ (prompts for a name on a new migration)
```

`PrismaService` connects on module init, so `dev:backend`, `start:backend`, and `test:e2e -w backend` all fail fast if the database isn't reachable. `db:down -w backend` stops it; the named Docker volume keeps your data across restarts.

## Run the apps

```bash
npm run dev:frontend    # terminal 1 → http://localhost:3000
npm run dev:backend     # terminal 2 → http://localhost:4000/api/greeting
```

Two terminals, by design — there is no task runner. Production builds:

```bash
npm run build           # both workspaces
npm run start:frontend  # serves the built Next app
npm run start:backend   # node dist/main
```

## Check your work before finishing

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Then the documentation half of the [definition of done](README.md#definition-of-done-for-any-change).

---

## Add a feature to the frontend

Say the feature is `billing`. Work outside-in on the thinking, inside-out on the typing.

**1. Domain — what is true.**

```
src/features/billing/domain/entities/invoice.ts                 Invoice + createInvoice (invariants)
src/features/billing/domain/repositories/invoice.repository.ts  InvoiceRepository port
```

The port describes what the feature needs, in domain terms: `findAll(): Promise<Result<Invoice[], AppError>>`. It says nothing about HTTP or SQL.

**2. Application — what the user can do.**

```
src/features/billing/application/dto/invoice.dto.ts
src/features/billing/application/mappers/invoice.mapper.ts
src/features/billing/application/use-cases/list-invoices.use-case.ts
```

`makeListInvoices({ invoiceRepository })` returns a function that calls the port and maps entities to DTOs.

**3. Infrastructure — how it is really done.**

```
src/features/billing/infrastructure/repositories/http-invoice.repository.ts
src/features/billing/infrastructure/di/billing.container.ts
```

The container constructs the adapter and passes it to the use case factory.

**4. Presentation — what the customer sees.**

```
src/features/billing/presentation/components/invoice-table.tsx   props only
src/features/billing/presentation/views/billing-view.tsx         async Server Component
```

The view calls `billingContainer.listInvoices()` and branches on `result.ok`.

**5. The door.**

```ts
// src/features/billing/index.ts
export { BillingView } from "./presentation/views/billing-view";
export type { InvoiceDto } from "./application/dto/invoice.dto";
```

**6. The route.**

```tsx
// src/app/billing/page.tsx
import { BillingView } from "@/features/billing";

export default function BillingPage() {
  return <BillingView />;
}
```

**7. Update the docs** — [01-overview](01-overview.md) (a feature now exists), [03-project-structure](03-project-structure.md) (the tree), and the [CHANGELOG](CHANGELOG.md).

---

## Add an endpoint to the backend

Same slice, Nest flavour. For a `customers` feature:

**1–3.** `domain/`, `application/`, `infrastructure/repositories/` exactly as above. Remember the DI token beside the port:

```ts
export const CUSTOMER_REPOSITORY = Symbol('CustomerRepository');
```

If the route accepts a body, add a validated request class next to the controller, implementing the application-layer DTO so the two can't silently drift:

```ts
// presentation/dto/create-customer.request.ts
export class CreateCustomerRequest implements CreateCustomerDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
}
```

**4. Controller.**

```ts
@Controller('customers')
export class CustomerController {
  constructor(private readonly listCustomers: ListCustomersUseCase) {}

  @Get()
  async findAll(): Promise<CustomerDto[]> {
    const result = await this.listCustomers.execute();
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }
}
```

**5. Composition root** — `infrastructure/customer.module.ts`, binding the token to the adapter and building the use case with `useFactory`, as in [`greeting.module.ts`](../backend/src/features/greeting/infrastructure/greeting.module.ts) or, for a database-backed example, [`users.module.ts`](../backend/src/features/users/infrastructure/users.module.ts).

If the repository is Prisma-backed: add the model to [`prisma/schema.prisma`](../backend/prisma/schema.prisma), then `npm run prisma:migrate -w backend` to create and apply a migration. `PrismaService` is `@Global()`, so the repository's constructor just takes `private readonly prisma: PrismaService` — no explicit import of `PrismaModule` needed.

**6. Register it** in [`app.module.ts`](../backend/src/app.module.ts):

```ts
@Module({ imports: [PrismaModule, GreetingModule, CustomerModule] })
export class AppModule {}
```

**7. Test it.** A `*.spec.ts` next to each use case with a fake repository (see [`create-user.use-case.spec.ts`](../backend/src/features/users/application/use-cases/create-user.use-case.spec.ts) for the shape), and an entry in `backend/test/*.e2e-spec.ts` if the route matters end to end — bring the database up first (`npm run db:up -w backend`). Remember e2e hits `/customers`, not `/api/customers`. If the test creates data, generate a unique value (`randomUUID()`) and clean up at the end, as [`users-auth.e2e-spec.ts`](../backend/test/users-auth.e2e-spec.ts) does — the suite runs against a real, shared database, not a fixture.

**8. Update the docs** — endpoint table in `backend/README.md`, plus [03-project-structure](03-project-structure.md) and the [CHANGELOG](CHANGELOG.md).

---

## Protect a backend route with JWT

Attach the guard — it lives in `shared/`, not in `features/auth/`, and works from any feature without importing the auth feature:

```ts
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get()
findAll() { ... }
```

That's the whole recipe — no module wiring needed, since `AuthModule` (which binds the guard's `TOKEN_SERVICE` dependency) is `@Global()`. Inside a handler, the verified claims are on the request as `request.user: TokenPayload` (`{ sub, email }`), via the ambient augmentation in [`shared/http/express.d.ts`](../backend/src/shared/http/express.d.ts).

**Do not** put a guard, interceptor, or pipe more than one feature will use *inside* a specific feature's `presentation/` folder — if a second feature needs it and also happens to be a dependency of the feature that owns it, you get a circular module import. This happened once already building `JwtAuthGuard`: see [ADR-0012](08-decisions.md#adr-0012--the-jwt-guard-lives-in-shared-not-in-the-auth-feature) and pattern 15 in [04-patterns](04-patterns.md).

---

## Swap an adapter

This is the payoff of the architecture, so it is worth doing at least once to see how small it is.

### Connect the frontend to the backend

Today the landing page renders from a static adapter. To read from `GET /api/greeting` instead:

**1.** Add the API base URL to the frontend's config module:

```ts
// frontend/src/core/config/env.ts
apiUrl: process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000/api",
```

**2.** Add a second adapter beside the static one — same folder, same port, different mechanism:

```ts
// frontend/src/features/landing/infrastructure/repositories/http-greeting.repository.ts
import { env, err, UnexpectedError, type AppError, type Result } from "@/core";
import { createGreeting, type Greeting } from "../../domain/entities/greeting";
import type { GreetingRepository } from "../../domain/repositories/greeting.repository";

export function createHttpGreetingRepository(): GreetingRepository {
  return {
    async findCurrent(): Promise<Result<Greeting, AppError>> {
      try {
        const response = await fetch(`${env.apiUrl}/greeting`, { cache: "no-store" });

        if (!response.ok) {
          return err(
            new UnexpectedError(`The API answered with ${response.status}.`),
          );
        }

        const body = (await response.json()) as Partial<Greeting>;
        const greeting = createGreeting({
          headline: body.headline ?? "",
          message: body.message ?? "",
        });

        return greeting.ok
          ? greeting
          : err(
              new UnexpectedError("The API returned an invalid greeting.", {
                cause: greeting.error,
              }),
            );
      } catch (cause) {
        return err(new UnexpectedError("Could not reach the API.", { cause }));
      }
    },
  };
}
```

Note what the adapter is responsible for: reaching the outside world, translating every foreign failure into an `AppError`, and pushing the response back through the entity factory so an untrusted payload cannot become an invalid entity.

**3.** Change **one line** in the composition root:

```diff
- const greetingRepository = createStaticGreetingRepository();
+ const greetingRepository = createHttpGreetingRepository();
```

Nothing in `domain/`, `application/`, or `presentation/` changes. Because the view is a Server Component, the fetch happens server-side and CORS is not involved; the backend's `CORS_ORIGIN` matters only for calls made from the browser.

**4.** Update [01-overview](01-overview.md) (the apps are wired now), `frontend/README.md`, and the [CHANGELOG](CHANGELOG.md).

---

## Add a dependency

```bash
npm install <pkg> -w frontend
npm install -D <pkg> -w backend
```

Always from the root with `-w`, never by `cd`-ing into a workspace. If both workspaces need the same dev dependency, pin the **same major** in both so npm hoists one copy. Then record it in [05-technologies](05-technologies.md).

## Add a script

Add it to the workspace's `package.json`; if it is useful across both, add a fan-out or `-w` wrapper at the root. Document it in the root `README.md` table and here.

---

## Troubleshooting

| Symptom                                                             | Cause and fix                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `EADDRINUSE` on 3000 or 4000                                          | A previous dev server is alive: `lsof -ti:3000 \| xargs kill`                                        |
| `Cannot find name 'PageProps'` / `'LayoutProps'`                      | Next's generated route types are missing. Run `npm run dev -w frontend` or `npx next typegen` in `frontend/`. |
| Jest: `Could not locate module @/…`                                   | A Jest config is missing its `moduleNameMapper` — see [05-technologies](05-technologies.md#nestjs-things-worth-knowing). Note the e2e config's `rootDir` is `test/`. |
| e2e test 404s on `/api/...`                                           | Expected. The global prefix is applied in `main.ts`, which e2e tests do not run. Use the unprefixed path. |
| `frontend/AGENTS.md` reappears after you delete it                    | `next dev` regenerates it. Leave it; commit it with your work.                                       |
| ESLint: *"import is restricted from being used by a pattern"*         | You crossed an architectural boundary. Move the code to the right layer, or go through the feature's `index.ts`. Do not add an eslint-disable comment. |
| A nested `node_modules/` appears inside a workspace                   | Two workspaces want different majors of the same package. Align the versions and reinstall.          |
| Backend lint fails on formatting                                      | Prettier drift: `npm run lint:fix -w backend`.                                                       |
| Changed `tsconfig.json` paths and runtime broke                       | Nest rewrites aliases at build time and Jest maps them separately — update `tsconfig`, both Jest configs, and rebuild. |
| `start:prod` / `node dist/main` fails with `Cannot find module '.../dist/main.js'` | `nest build`'s inferred `rootDir` widened — check `dist/` for a nested `dist/src/main.js` instead. Usually caused by a new `.ts` file at the backend root (like `prisma.config.ts`). Fix: pin `rootDir` and exclude the offending file in `tsconfig.build.json`, as already done there. |
| `nest build` reports success but `dist/` is empty, missing, or stale  | Delete `backend/tsconfig.build.tsbuildinfo` (the `incremental`-mode cache — it lives at the backend root, so `rm -rf dist` doesn't touch it) and rebuild.                                             |
| `InvalidDecoratorItemException: Invalid guard passed to @UseGuards()` (or the guard/provider is `undefined` at boot) | A circular CommonJS `require()` between two features — check whether feature A imports feature B's public API while B (directly or via its module graph) imports A's. Move the shared piece to `shared/` or `core/` so neither feature needs the other for it; see [ADR-0012](08-decisions.md#adr-0012--the-jwt-guard-lives-in-shared-not-in-the-auth-feature). |
| `Type 'string' is not assignable to type 'number \| StringValue \| undefined'` wiring `@nestjs/jwt`'s `expiresIn` | It wants a `number` (seconds) or a branded literal string type from `ms`, not a generic `string`. Use a numeric seconds env var (`JWT_EXPIRES_IN_SECONDS`) instead of casting.                       |
| Prisma: `The datasource property 'url' is no longer supported in schema files` (`P1012`) | Prisma 7. Remove `url` from `schema.prisma`'s `datasource` block; put it in `prisma.config.ts`'s `datasource.url` instead. See [05-technologies](05-technologies.md#prisma-7--this-is-not-the-prisma-you-remember). |
| Prisma: `new PrismaClient()` throws about a missing adapter             | Prisma 7 requires a driver adapter always. Pass `{ adapter: new PrismaPg({ connectionString }) }` — see [`prisma.service.ts`](../backend/src/shared/prisma/prisma.service.ts).                        |
| `npm run test:e2e -w backend` fails entirely, not just DB-touching tests | The database isn't up — `PrismaService` connects eagerly when `AppModule` is bootstrapped. Run `npm run db:up -w backend` first.                                                                      |

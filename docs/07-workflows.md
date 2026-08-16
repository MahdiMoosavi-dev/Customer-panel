# 07 — Workflows

> Last updated: 2026-08-16

Step-by-step recipes for the things you will actually do. All commands run from the **repo root** unless stated otherwise.

---

## First-time setup

```bash
npm install                      # installs both workspaces into one hoisted node_modules
cp frontend/.env.example frontend/.env.local     # optional; defaults work without it
cp backend/.env.example backend/.env             # optional
```

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

**5. Composition root** — `infrastructure/customer.module.ts`, binding the token to the adapter and building the use case with `useFactory`, as in [`greeting.module.ts`](../backend/src/features/greeting/infrastructure/greeting.module.ts).

**6. Register it** in [`app.module.ts`](../backend/src/app.module.ts):

```ts
@Module({ imports: [GreetingModule, CustomerModule] })
export class AppModule {}
```

**7. Test it.** A `*.spec.ts` next to the use case with a fake repository, and an entry in `backend/test/*.e2e-spec.ts` if the route matters end to end. Remember e2e hits `/customers`, not `/api/customers`.

**8. Update the docs** — endpoint table in `backend/README.md`, plus [03-project-structure](03-project-structure.md) and the [CHANGELOG](CHANGELOG.md).

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

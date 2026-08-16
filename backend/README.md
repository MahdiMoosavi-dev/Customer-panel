# @customer-panel/backend

NestJS 11 API, organized as **feature slices with clean architecture**. Part of the [Customer Panel monorepo](../README.md) — run `npm install` at the repo root, not here.

## First-time setup

```bash
cp .env.example .env      # only if you don't already have one
npm run db:up              # starts Postgres 17 in Docker (docker-compose.yml)
npm run prisma:migrate      # applies prisma/migrations/ to it
npm run start:dev           # watch mode → http://localhost:4000/api
```

## Commands

```bash
npm run start:dev             # watch mode → http://localhost:4000/api
npm run build                 # nest build → dist/
npm run start:prod            # node dist/main
npm run lint                  # eslint, including architecture boundary rules
npm run typecheck             # tsc --noEmit
npm test                      # unit tests (jest)
npm run test:e2e              # http-level tests (supertest) — needs the database up

npm run db:up                 # docker compose up -d   (Postgres 17)
npm run db:down               # docker compose down
npm run db:logs               # tail the database container's logs
npm run prisma:generate       # regenerate the Prisma client from schema.prisma
npm run prisma:migrate        # create + apply a migration in dev (prompts for a name)
npm run prisma:migrate:deploy # apply existing migrations without prompting (CI/prod)
npm run prisma:studio         # browse the database in Prisma Studio
```

`prisma generate` also runs automatically via `postinstall`, so a fresh `npm install` at the repo root leaves the client ready.

## Endpoints

| Method   | Path              | Auth           | Body                                | Returns                                     |
| -------- | ----------------- | -------------- | ------------------------------------ | -------------------------------------------- |
| `GET`    | `/api/greeting`   | —              | —                                    | `{ headline, message }`                      |
| `POST`   | `/api/users`      | —              | `{ email, name, password }`          | `201` created user (no password)             |
| `GET`    | `/api/users`      | Bearer token   | —                                    | `200` `{ items, total, page, pageSize }` — search, filter, sort, paginate (see below) |
| `GET`    | `/api/users/:id`  | Bearer token   | —                                    | `200` a user, or `404`                       |
| `PATCH`  | `/api/users/:id`  | —              | `{ email?, name?, password? }`       | `200` updated user, or `404`                 |
| `DELETE` | `/api/users/:id`  | —              | —                                    | `204`, or `404`                              |
| `POST`   | `/api/auth/login` | —              | `{ email, password }`                | `{ accessToken }`, or `401`                  |
| `POST`   | `/api/products`   | Bearer token   | `{ title, shortDescription, longDescription, imageUrl, price, category }` | `201` created product, or `400`/`401` |
| `GET`    | `/api/products`   | —              | —                                    | `200` `{ items, total, page, pageSize }` — search, sort, paginate (see below) |
| `GET`    | `/api/products/:id` | —           | —                                    | `200` a product, or `404`                    |
| `PATCH`  | `/api/products/:id` | Bearer token | `{ title?, shortDescription?, longDescription?, imageUrl?, price?, category? }` | `200` updated product, or `401`/`404` |
| `DELETE` | `/api/products/:id` | Bearer token | —                                   | `204`, or `401`/`404` — also removes it from every cart |
| `GET`    | `/api/cart`       | Bearer token   | —                                    | `200` the caller's cart items, enriched with product details |
| `POST`   | `/api/cart/items` | Bearer token   | `{ productId, quantity? }`            | `201` the added/updated cart item, or `401`/`404` |
| `DELETE` | `/api/cart/items/:productId` | Bearer token | —                         | `204`, or `401`/`404`                        |

`POST /users` is the registration endpoint and stays open by design. Product browsing (`GET /products`, `GET /products/:id`) is public; every other mutating route above requires a bearer token. `PATCH`/`DELETE /users/:id` are still ungated, which is a deliberate, documented gap; see [ADR-0013](../docs/08-decisions.md#adr-0013--jwt-guard-only-on-get-users-for-now). There is likewise no admin/role system yet, so any logged-in user can create, edit, or delete *any* product — see [ADR-0018](../docs/08-decisions.md#adr-0018--products-and-cart-data-model-and-scope). Every `cart` route acts on the caller's own cart only — the user id comes from the verified token (`request.user.sub`), never from the body or a path param.

A user record never serializes its password hash — see `UserDto` / `toUserDto`.

### `GET /users` query parameters

| Param         | Type                                          | Default     | Notes                                          |
| ------------- | ---------------------------------------------- | ----------- | ------------------------------------------------ |
| `page`        | integer ≥ 1                                    | `1`         |                                                    |
| `pageSize`    | integer, 1–100                                 | `20`        | Requests above 100 are rejected with `400`, not silently capped. |
| `search`      | string                                          | —           | Case-insensitive match against `name` **or** `email`. |
| `createdFrom` | ISO 8601 date-time                              | —           | Inclusive lower bound on `createdAt`.            |
| `createdTo`   | ISO 8601 date-time                              | —           | Inclusive upper bound on `createdAt`.            |
| `sortBy`      | `name` \| `email` \| `createdAt` \| `updatedAt` | `createdAt` |                                                    |
| `sortOrder`   | `asc` \| `desc`                                 | `asc`       |                                                    |

An unknown `sortBy`/`sortOrder` value is rejected with `400` (`class-validator`'s `@IsIn`), not silently ignored. See [ADR-0017](../docs/08-decisions.md#adr-0017--search-filter-sort-and-pagination-on-get-users).

### `GET /products` query parameters

Same shape as `GET /users` (pattern 19 in [04-patterns](../docs/04-patterns.md)), minus a date filter — there was no obvious date-range filter to add for products, so none was built speculatively.

| Param       | Type                                       | Default     | Notes                                 |
| ----------- | -------------------------------------------- | ----------- | ---------------------------------------- |
| `page`      | integer ≥ 1                                  | `1`         |                                            |
| `pageSize`  | integer, 1–100                               | `20`        | Rejected with `400` above 100, not capped. |
| `search`    | string                                        | —           | Case-insensitive match against `title` only — not `category` or the descriptions. |
| `sortBy`    | `title` \| `price` \| `createdAt` \| `updatedAt` | `createdAt` |                                            |
| `sortOrder` | `asc` \| `desc`                               | `asc`       |                                            |

### Cart behavior

- **Add** (`POST /cart/items`) is an upsert: a new `productId` creates a line at the given quantity (default `1`); an existing one **increments** by that amount. There is no endpoint to set an exact quantity — see [ADR-0018](../docs/08-decisions.md#adr-0018--products-and-cart-data-model-and-scope) for why, and what the follow-up would look like.
- **Remove** (`DELETE /cart/items/:productId`) deletes the line entirely, regardless of quantity — it does not decrement by one.
- Adding a `productId` that doesn't exist returns `404` before anything is written.
- Deleting a product removes it from every cart that had it (`onDelete: Cascade` in [`schema.prisma`](prisma/schema.prisma)) — no cleanup use case needed.

## API docs (Swagger / OpenAPI)

```
http://localhost:4000/docs         # interactive Swagger UI
http://localhost:4000/docs-json    # the raw OpenAPI document
```

Every route, request body, and response shape is documented from the same request/response classes that already exist for validation — see [Documenting the API](#documenting-the-api) below. To call a protected route from the UI: `POST /users` → `POST /auth/login` to get a token → the **Authorize** button (top right) → paste the token (no `Bearer ` prefix, the UI adds it).

### Trying it from the command line

```bash
curl -X POST localhost:4000/api/users -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","name":"Ada Lovelace","password":"s3cret!!"}'

TOKEN=$(curl -s -X POST localhost:4000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"s3cret!!"}' | node -e \
  "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).accessToken))")

curl localhost:4000/api/users -H "Authorization: Bearer $TOKEN"

PRODUCT_ID=$(curl -s -X POST localhost:4000/api/products -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d \
  '{"title":"Desk Lamp","shortDescription":"Warm LED","longDescription":"Dimmable, USB-C powered.","imageUrl":"https://example.com/lamp.jpg","price":29.99,"category":"Lighting"}' \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))")

curl -X POST localhost:4000/api/cart/items -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"productId\":\"$PRODUCT_ID\"}"

curl localhost:4000/api/cart -H "Authorization: Bearer $TOKEN"
```

## Structure

```
src/
├── main.ts                                   # bootstrap: prefix, CORS, port, global ValidationPipe
├── app.module.ts                              # composes feature modules, no logic
├── core/                                      # framework-agnostic primitives
│   ├── config/env.ts                          # env vars read and defaulted once (loads dotenv)
│   ├── domain/result.ts                       # Result<T, E> — errors as values
│   ├── domain/app-error.ts                    # AppError hierarchy
│   ├── domain/token.ts                        # TokenService port + TokenPayload — cross-cutting, see below
│   ├── domain/pagination.ts                   # Paginated<T> + SortOrder — shared by any feature that paginates
│   └── index.ts                               # public API → "@/core"
├── shared/
│   ├── http/to-http-exception.ts               # AppError code → HTTP status
│   ├── http/api-error-response.ts               # documents toHttpException's fixed error shape once
│   ├── http/jwt-auth.guard.ts                  # @UseGuards(JwtAuthGuard) — verifies a bearer token
│   ├── http/express.d.ts                       # augments Express.Request with `user?: TokenPayload`
│   └── prisma/prisma.service.ts, prisma.module.ts   # @Global() — the one PrismaClient instance
├── features/greeting/                          # walking-skeleton reference feature — see docs/01-overview.md
│   └── presentation/dto/greeting.response.ts    # @ApiProperty — documentation-only, implements GreetingDto
├── features/users/                             # User entity + CRUD
│   ├── domain/
│   │   ├── entities/user.ts                    # createUser() factory — normalizes + validates
│   │   ├── repositories/user.repository.ts      # UserRepository port + USER_REPOSITORY token
│   │   └── services/password-hasher.ts          # PasswordHasher port + PASSWORD_HASHER token
│   ├── application/
│   │   ├── dto/{user,create-user,update-user,credentials,get-users-query}.dto.ts
│   │   ├── mappers/user.mapper.ts                # strips passwordHash on the way out
│   │   └── use-cases/
│   │       ├── create-user.use-case.ts
│   │       ├── get-users.use-case.ts (+ .spec.ts)   # applies paging/sort defaults, caps pageSize at 100
│   │       ├── get-user-by-id.use-case.ts
│   │       ├── update-user.use-case.ts
│   │       ├── delete-user.use-case.ts
│   │       └── verify-user-credentials.use-case.ts   # exported for the auth feature — see below
│   ├── infrastructure/
│   │   ├── repositories/prisma-user.repository.ts   # findAll also builds the WHERE/ORDER BY/skip-take
│   │   ├── services/bcrypt-password-hasher.ts
│   │   └── users.module.ts                       # composition root
│   ├── presentation/
│   │   ├── dto/{create-user,update-user}.request.ts   # class-validator + @ApiProperty, implements the app-layer DTO
│   │   ├── dto/get-users.request.ts                    # class-validator only — no @ApiProperty, see below
│   │   ├── dto/{user,get-users}.response.ts             # @ApiProperty-only, implements the app-layer DTO
│   │   └── controllers/users.controller.ts
│   └── index.ts                                  # public API → "@/features/users"
├── features/auth/                               # login only — the JWT guard lives in shared/, not here
│   ├── application/
│   │   ├── dto/{login,auth-token}.dto.ts
│   │   └── use-cases/login.use-case.ts            # depends on users' VerifyUserCredentialsUseCase
│   ├── infrastructure/
│   │   ├── services/jwt-token.service.ts           # implements TokenService with @nestjs/jwt
│   │   └── auth.module.ts                          # @Global() composition root
│   ├── presentation/
│   │   ├── dto/login.request.ts, auth-token.response.ts
│   │   └── controllers/auth.controller.ts
│   └── index.ts                                    # public API → "@/features/auth"
├── features/products/                           # Product entity + CRUD; GET routes public, mutations gated
│   ├── domain/
│   │   ├── entities/product.ts                    # createProduct() factory — normalizes + validates
│   │   └── repositories/product.repository.ts      # ProductRepository port + PRODUCT_REPOSITORY token
│   ├── application/
│   │   ├── dto/{product,create-product,update-product,get-products-query}.dto.ts
│   │   ├── mappers/product.mapper.ts
│   │   └── use-cases/
│   │       ├── create-product.use-case.ts (+ .spec.ts)
│   │       ├── get-products.use-case.ts (+ .spec.ts)
│   │       ├── get-product-by-id.use-case.ts
│   │       ├── get-products-by-ids.use-case.ts (+ .spec.ts)   # exported for the cart feature
│   │       ├── update-product.use-case.ts
│   │       └── delete-product.use-case.ts
│   ├── infrastructure/
│   │   ├── repositories/prisma-product.repository.ts
│   │   └── products.module.ts                      # composition root
│   ├── presentation/
│   │   ├── dto/{create-product,update-product}.request.ts
│   │   ├── dto/get-products.request.ts              # class-validator only, same reason as get-users.request.ts
│   │   ├── dto/{product,get-products}.response.ts
│   │   └── controllers/products.controller.ts
│   └── index.ts                                    # public API → "@/features/products"
└── features/cart/                               # every route requires a token, scoped to request.user.sub
    ├── domain/
    │   ├── entities/cart-item.ts
    │   └── repositories/cart.repository.ts          # CartRepository port + CART_REPOSITORY token
    ├── application/
    │   ├── dto/{cart-item,add-cart-item}.dto.ts
    │   ├── mappers/cart-item.mapper.ts              # combines a CartItem with products' ProductDto
    │   └── use-cases/
    │       ├── get-cart.use-case.ts (+ .spec.ts)        # depends on products' GetProductsByIdsUseCase
    │       ├── add-cart-item.use-case.ts (+ .spec.ts)   # depends on products' GetProductByIdUseCase
    │       └── remove-cart-item.use-case.ts (+ .spec.ts)
    ├── infrastructure/
    │   ├── repositories/prisma-cart.repository.ts   # upsert-with-increment for add, delete for remove
    │   └── cart.module.ts                            # imports ProductsModule; composition root
    ├── presentation/
    │   ├── dto/add-cart-item.request.ts, cart-item.response.ts
    │   └── controllers/cart.controller.ts
    └── index.ts                                      # public API → "@/features/cart"

prisma/
├── schema.prisma                                 # models — no datasource url (Prisma 7, see below)
└── migrations/
prisma.config.ts                                  # CLI-only: schema path + DATABASE_URL for migrate/generate
docker-compose.yml                                 # Postgres 17 for local dev
```

`@/*` maps to `src/*`; the Nest CLI rewrites the alias to relative requires at build time, so `node dist/main` needs no loader.

## Dependency injection without polluting the domain

An interface cannot be a DI token, so the domain exports a `Symbol` alongside it:

```ts
export interface UserRepository { ... }
export const USER_REPOSITORY = Symbol('UserRepository');
```

The feature module — the only Nest-aware file in the wiring path — binds the token to an adapter and constructs the use case with a factory. That is why the use cases need no `@Injectable()` and can be unit-tested with a hand-written fake, as in [get-greeting.use-case.spec.ts](src/features/greeting/application/use-cases/get-greeting.use-case.spec.ts), [create-user.use-case.spec.ts](src/features/users/application/use-cases/create-user.use-case.spec.ts) and [verify-user-credentials.use-case.spec.ts](src/features/users/application/use-cases/verify-user-credentials.use-case.spec.ts).

## How a feature depends on another feature

`auth`'s `LoginUseCase` needs to check a password, but it does not own a `UserRepository` or a `PasswordHasher` — `users` does. Rather than reach into `users`' internals, `users` exposes one more use case through its public API purpose-built for this:

```ts
// features/users/index.ts
export { VerifyUserCredentialsUseCase } from './application/use-cases/verify-user-credentials.use-case';
```

`AuthModule` imports `UsersModule` and injects that use case into `LoginUseCase`. Auth never sees a password hash or a repository — it only knows "ask users whether these credentials are valid."

The `cart` feature is the second example of this shape: it needs to confirm a product exists and to fetch product details, but never sees a `ProductRepository`. `products/index.ts` exports `GetProductByIdUseCase` and `GetProductsByIdsUseCase`; `CartModule` imports `ProductsModule` and injects them into `AddCartItemUseCase` and `GetCartUseCase` respectively, the same `useFactory` + `inject` shape `AuthModule` uses for `LoginUseCase`.

## The JWT guard lives in `shared/`, not in `features/auth/`

The obvious place for `JwtAuthGuard` looks like `features/auth/presentation/`. It isn't there, for a concrete reason: `UsersController` needs the guard, `auth` needs `users` (see above), and if the guard also lived inside `auth`, importing it from `users` would close a circular `require()` loop — which fails at runtime (`InvalidDecoratorItemException`, `JwtAuthGuard` resolving to `undefined` inside the decorator), not just at lint time. It genuinely happened once while building this.

The fix is that a bearer-token guard isn't really "the auth feature's business" — it's HTTP-layer plumbing any feature can attach with `@UseGuards()`, exactly like `to-http-exception.ts` already is. So:

- `core/domain/token.ts` owns the **port** — `TokenService`, `TokenPayload`, `TOKEN_SERVICE` — a cross-cutting contract next to `Result`/`AppError`.
- `shared/http/jwt-auth.guard.ts` owns the **guard** — depends only on `core` and `@nestjs/common`, never on `features/auth`.
- `features/auth/infrastructure/services/jwt-token.service.ts` owns the **adapter** — the only file that knows a JWT is involved, binding `TOKEN_SERVICE` in `AuthModule`.

Protect a route in any feature with:

```ts
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get()
findAll() { ... }
```

`AuthModule` is `@Global()`, so `TOKEN_SERVICE`'s binding is visible everywhere without every feature importing `AuthModule`. See [ADR-0012](../docs/08-decisions.md#adr-0012--the-jwt-guard-lives-in-shared-not-in-the-auth-feature).

## Prisma 7

This project uses Prisma 7, which changed enough that recalled knowledge of older Prisma versions will be wrong here:

- **No `url` in `schema.prisma`.** `datasource { url = env("DATABASE_URL") }` is a hard error now. The CLI (migrate/generate/studio) reads `DATABASE_URL` from **`prisma.config.ts`** instead.
- **The runtime client requires a driver adapter.** `new PrismaClient()` with no arguments no longer works. [`PrismaService`](src/shared/prisma/prisma.service.ts) constructs one explicitly: `new PrismaClient({ adapter: new PrismaPg({ connectionString: env.databaseUrl }) })`, using `@prisma/adapter-pg` + `pg`.
- **Generator provider matters.** The new default, `"prisma-client"`, emits ESM-only TypeScript (`import.meta.url`) that a CommonJS Nest build can't compile. This project deliberately keeps the classic `"prisma-client-js"` provider — CommonJS output, no custom `output` path needed. See [ADR-0014](../docs/08-decisions.md#adr-0014--stay-on-the-classic-prisma-client-js-generator).
- **`prisma migrate dev` does not also run `generate`** the way older versions did in this setup — run `npm run prisma:generate` (or `postinstall` will, on the next `npm install`) if types look stale after a schema change.

Errors are translated at the repository boundary using Prisma's known error codes — `P2002` (unique constraint) → `ConflictError`, `P2025` (record not found) → `NotFoundError` — see [prisma-user.repository.ts](src/features/users/infrastructure/repositories/prisma-user.repository.ts).

## Errors

Use cases return `Result<T, AppError>` rather than throwing. The controller (or `JwtAuthGuard`) is the place that converts a failure into transport terms via `toHttpException`, which maps `VALIDATION_ERROR → 400`, `NOT_FOUND → 404`, `CONFLICT → 409`, `UNAUTHORIZED → 401`, and anything else to `500`.

## Request validation

`application/dto/*.dto.ts` stay plain TypeScript interfaces — framework-free, per the layering rule. Validation lives one layer out, in `presentation/dto/*.request.ts` classes that `implements` the application DTO (a compile error if the two drift) and carry `class-validator` decorators:

```ts
export class CreateUserRequest implements CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(8) password!: string;
}
```

A global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` in [main.ts](src/main.ts) enforces every request DTO.

## Documenting the API

`@nestjs/swagger` builds the OpenAPI document from decorators, and decorators only work on runtime classes — but `application/dto/*.dto.ts` are deliberately plain interfaces (erased at compile time, so Swagger can't introspect them). Request bodies already had a class for this (`presentation/dto/*.request.ts`, for `class-validator`); responses get the same treatment, one level further out:

```ts
// application/dto/user.dto.ts — framework-free, unchanged
export interface UserDto { readonly id: string; ... }

// presentation/dto/user.response.ts — documentation-only
export class UserResponse implements UserDto {
  @ApiProperty({ example: '81c00...' }) id!: string;
  ...
}
```

`implements UserDto` is what keeps it honest — the response class fails to compile if the application DTO's shape changes underneath it. The controller still returns the plain interface value; `@ApiResponse({ type: UserResponse })` only tells Swagger which schema to render, it has no effect on what's actually serialized.

Error bodies are documented once, not per endpoint — [`ApiErrorResponse`](src/shared/http/api-error-response.ts) mirrors the fixed `{ statusCode, code, message }` shape `toHttpException` always produces, and every `@ApiResponse` for a failure case points at it.

**Query-string DTOs are the one exception to "decorate the class."** `@nestjs/swagger` reads `@ApiProperty` off a class automatically for `@Body()` parameters, but not for `@Query()` ones — without the (deliberately unused, see [05-technologies](../docs/05-technologies.md)) CLI plugin, a `@Query() query: GetUsersRequest` parameter renders nothing in Swagger UI. [`GetUsersRequest`](src/features/users/presentation/dto/get-users.request.ts) therefore carries only `class-validator` decorators; each param is documented instead with an explicit `@ApiQuery({ name: ... })` on the controller method, the same way `@ApiParam` already documents `:id`.

`main.ts` builds the document with `DocumentBuilder().addBearerAuth(..., 'access-token')`; a controller method marks itself protected with `@ApiBearerAuth('access-token')` — kept in sync by hand with `@UseGuards(JwtAuthGuard)`, since Swagger has no way to detect a guard's meaning from the class alone.

## Adding a feature

```
src/features/<name>/
  domain/         entities, value objects, repository/service interfaces + tokens
  application/    use cases, DTOs, mappers
  infrastructure/ repository/service implementations, <name>.module.ts
  presentation/   controllers, request DTOs (+ @ApiProperty), response DTOs for Swagger
  index.ts        export the module and whatever types callers need
```

Then add the module to `imports` in [app.module.ts](src/app.module.ts).

## Configuration

See [src/core/config/env.ts](src/core/config/env.ts) and [.env.example](.env.example).

| Variable                 | Default                                                                    |
| ------------------------- | --------------------------------------------------------------------------- |
| `PORT`                    | `4000`                                                                       |
| `API_PREFIX`               | `api`                                                                        |
| `APP_NAME`                 | `Customer Panel`                                                             |
| `CORS_ORIGIN`               | `http://localhost:3000`                                                      |
| `POSTGRES_USER`             | `customer_panel` — read by `docker-compose.yml`                             |
| `POSTGRES_PASSWORD`          | `customer_panel` — read by `docker-compose.yml`                             |
| `POSTGRES_DB`                | `customer_panel` — read by `docker-compose.yml`                             |
| `POSTGRES_PORT`               | `5432` — read by `docker-compose.yml`                                       |
| `DATABASE_URL`                | `postgresql://customer_panel:customer_panel@localhost:5432/customer_panel` — read by the app and by `prisma.config.ts` |
| `JWT_SECRET`                    | `dev-secret-change-me` — **change this outside local dev**                  |
| `JWT_EXPIRES_IN_SECONDS`          | `3600`                                                                       |

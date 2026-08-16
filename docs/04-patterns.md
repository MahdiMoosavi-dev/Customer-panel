# 04 — Patterns

> Last updated: 2026-08-16 (added: cross-feature use cases, shared guards, request-DTO validation, Prisma error translation, response DTOs for Swagger, generic pagination + query DTOs; products/cart as a second cross-feature-use-case example)

The recurring patterns in this codebase, each with what it is, why it is here, and when *not* to reach for it. Code samples are trimmed for shape — the files linked from each section are the source of truth.

---

## 1. Feature slice with a public API

**What.** Every product concern is a folder under `features/`, containing its own four layers and a single `index.ts` that decides what the outside world may see.

```ts
// features/landing/index.ts
export { LandingView } from "./presentation/views/landing-view";
export type { GreetingDto } from "./application/dto/greeting.dto";
```

**Why.** It makes the blast radius of a change obvious and keeps the dependency graph between features from turning into a mesh. A feature can be deleted, moved, or rewritten behind its door.

**Rules.** Outside code imports `@/features/<name>`, never a deep path — ESLint enforces this. Inside a feature, imports are relative, so the slice stays self-contained.

---

## 2. Ports and adapters

**What.** The domain declares an interface for the data it needs. Infrastructure provides the implementation.

```ts
// domain/repositories/greeting.repository.ts   — the port
export interface GreetingRepository {
  findCurrent(): Promise<Result<Greeting, AppError>>;
}

// infrastructure/repositories/static-greeting.repository.ts   — an adapter
export function createStaticGreetingRepository(): GreetingRepository { … }
```

**Why.** The direction of the dependency is inverted: the inside defines the contract, the outside conforms. Static content becomes a database becomes a third-party API, and the use case never notices.

**When not to.** Do not create a port for something that will only ever have one implementation *and* has no I/O — pure functions can just be called.

---

## 3. Composition root

**What.** One file per feature knows which adapter satisfies which port. Nothing else does.

```ts
// frontend — infrastructure/di/landing.container.ts
export function createLandingContainer(): LandingContainer {
  const greetingRepository = createStaticGreetingRepository();
  return { getGreeting: makeGetGreeting({ greetingRepository }) };
}
export const landingContainer = createLandingContainer();
```

```ts
// backend — infrastructure/greeting.module.ts
@Module({
  controllers: [GreetingController],
  providers: [
    { provide: GREETING_REPOSITORY, useFactory: createStaticGreetingRepository },
    {
      provide: GetGreetingUseCase,
      useFactory: (repo: GreetingRepository) => new GetGreetingUseCase(repo),
      inject: [GREETING_REPOSITORY],
    },
  ],
})
export class GreetingModule {}
```

**Why.** Swapping an implementation is a one-line edit in one known place. Tests can build their own container with fakes.

**Note on the backend.** `useFactory` is chosen over `useClass` deliberately: it keeps `@Injectable()` — and therefore Nest — out of the application and infrastructure code. See [ADR-0007](08-decisions.md#adr-0007--keep-nest-decorators-out-of-domain-and-application).

---

## 4. DI tokens for interfaces (backend)

**What.** A TypeScript interface does not exist at runtime, so it cannot be a Nest injection token. The port ships with a `Symbol` beside it.

```ts
export interface GreetingRepository { … }
export const GREETING_REPOSITORY = Symbol('GreetingRepository');
```

**Why.** It keeps the token next to the contract it identifies, instead of in a separate constants file that drifts. A `Symbol` is framework-free, so the domain stays clean.

---

## 5. Errors as values — `Result<T, E>`

**What.** Anything that can fail returns a value describing success or failure instead of throwing.

```ts
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

**Why.** The compiler forces every caller to deal with both branches; you cannot forget a failure path, because `result.value` does not exist until you have narrowed `result.ok`. Failures become ordinary data that can be mapped and passed around.

**How it is used.** Use cases return `Result<Dto, AppError>`. The frontend view branches on it to pick a component; the backend controller branches on it to pick a status code. `mapResult` transforms a success and passes a failure through untouched.

**When not to.** Genuinely exceptional, unrecoverable conditions (bad configuration at boot, programmer error) may still throw — nobody is going to handle them meaningfully.

---

## 6. Error taxonomy

**What.** A small `AppError` hierarchy with a stable `code` on each class.

```ts
export abstract class AppError extends Error { abstract readonly code: string; }
export class ValidationError extends AppError { readonly code = 'VALIDATION_ERROR'; }
export class NotFoundError   extends AppError { readonly code = 'NOT_FOUND'; }
export class UnexpectedError extends AppError { readonly code = 'UNEXPECTED_ERROR'; }
```

**Why.** The `code` is what the edge translates and what clients can branch on; the message is for humans. Adding a new failure mode means adding a class and one line in the status map.

**Rule.** Infrastructure translates whatever it catches (a fetch failure, a driver error) into an `AppError` before returning. Raw third-party errors must not travel inward.

---

## 7. Error translation at the edge

**What.** Exactly one place converts a domain failure into transport terms.

```ts
// backend/src/shared/http/to-http-exception.ts
const STATUS_BY_CODE: Record<string, HttpStatus> = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  UNEXPECTED_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};
```

**Why.** Status codes are a property of HTTP, not of the business rule. Keeping the mapping in one table means a new error type gets a consistent status everywhere at once.

---

## 8. Entity factories that enforce invariants

**What.** Entities are created through a factory that validates, not with an object literal.

```ts
export function createGreeting(input: GreetingInput): Result<Greeting, ValidationError> {
  const headline = input.headline.trim();
  if (headline.length === 0) return err(new ValidationError('A greeting requires a headline.'));
  return ok({ headline, message: input.message.trim() });
}
```

**Why.** An invalid entity can never exist, so no downstream code needs a defensive check. Normalization (trimming, casing) happens once, at the only door in.

---

## 9. DTOs and mappers at the application boundary

**What.** Use cases return DTOs, produced by an explicit mapper. Entities never leave the feature's inner layers.

```ts
export function toGreetingDto(greeting: Greeting): GreetingDto {
  return { headline: greeting.headline, message: greeting.message };
}
```

**Why.** Components and HTTP responses become insulated from the internal model — you can add a field, a method, or a private invariant to an entity without changing the wire format or the UI. On the frontend it also guarantees what crosses the Server/Client Component boundary is plain, serializable data.

---

## 10. Framework-free use cases

**What.** A use case receives its dependencies as arguments and contains no framework imports.

```ts
// frontend — a factory returning a function
export function makeGetGreeting({ greetingRepository }: GetGreetingDependencies): GetGreeting {
  return async () => mapResult(await greetingRepository.findCurrent(), toGreetingDto);
}

// backend — a plain class, no @Injectable()
export class GetGreetingUseCase {
  constructor(private readonly greetingRepository: GreetingRepository) {}
  async execute(): Promise<Result<GreetingDto, AppError>> { … }
}
```

**Why.** Testing needs no React renderer and no Nest testing module — just `new GetGreetingUseCase(fake)`. See [`get-greeting.use-case.spec.ts`](../backend/src/features/greeting/application/use-cases/get-greeting.use-case.spec.ts), where the fake repository is four lines.

---

## 11. Server Components as the default (frontend)

**What.** Views are `async` Server Components that call the use case directly and pass DTOs down to pure presentational components. No `"use client"` anywhere yet.

**Why.** Data resolution happens on the server, so no loading state, no client fetch, and no business logic shipped to the browser. Reach for `"use client"` only at the leaf that genuinely needs interactivity or browser APIs, and keep it holding no rules.

---

## 12. Configuration in one module

**What.** `process.env` is read only in `core/config/env.ts`, which exports a frozen object with defaults applied.

**Why.** Every variable, its default, and its type live in one greppable place; the rest of the codebase imports `env` and cannot typo a variable name into `undefined`. On the frontend, `NEXT_PUBLIC_*` names must appear as full literals for Next.js to inline them, which this pattern guarantees.

---

## 13. Boundaries enforced by lint

**What.** `no-restricted-imports` rules encode the dependency rule and the feature-privacy rule in both workspaces.

**Why.** Written rules erode; a failing `npm run lint` does not. When you legitimately need to cross a boundary, the fix is to change the rule deliberately (and record it in [08-decisions](08-decisions.md)) rather than to slip past it.

**Note.** The backend rule originally only checked files *outside* `features/`, so one feature could still deep-import another feature's internals undetected. It was tightened to apply repo-wide once the `auth`/`users` pair made that gap concrete — see [ADR-0011](08-decisions.md#adr-0011--documentation-is-updated-in-the-same-session-as-the-change) era work in [backend/eslint.config.mjs](../backend/eslint.config.mjs).

---

## 14. Cross-feature composition through a purpose-built use case

**What.** When feature B genuinely needs something from feature A, A exposes a use case shaped for exactly that need — not its repository, not its internals.

```ts
// features/users/index.ts
export { VerifyUserCredentialsUseCase } from './application/use-cases/verify-user-credentials.use-case';
```

`auth`'s `LoginUseCase` takes a `VerifyUserCredentialsUseCase` in its constructor and calls `.execute({ email, password })`. It never sees a `UserRepository`, a `PasswordHasher`, or a password hash.

`cart` → `products` is the second occurrence of this shape, not a one-off: `products/index.ts` exports `GetProductByIdUseCase` (does this product exist?) and `GetProductsByIdsUseCase` (enrich these cart rows with product details), and `CartModule` imports `ProductsModule` to inject them into `AddCartItemUseCase` and `GetCartUseCase`. `cart` never sees a `ProductRepository` or a Prisma model.

**Why.** This is the feature-level version of ports and adapters: `users` decides how credential verification works (repository lookup, hash comparison, normalizing "no such user" and "wrong password" into the same generic failure) and publishes only the capability, not the mechanism. `auth` depends on a capability it can't misuse. Same reasoning for `products`/`cart`: `cart` needs "does this product exist" and "what does it look like," not "how are products stored."

**When not to.** If two features want the *same* primitive (not a capability one owns), that is a `core/` or `shared/` candidate instead — see pattern 12 and [ADR-0008](08-decisions.md#adr-0008--duplicate-core-primitives-instead-of-a-shared-package).

---

## 15. Cross-cutting guards live in `shared/`, not inside the feature that issues the tokens

**What.** `JwtAuthGuard` lives in `backend/src/shared/http/jwt-auth.guard.ts`, not in `features/auth/presentation/`. Its dependency — the `TokenService` port, `TokenPayload`, and the `TOKEN_SERVICE` token — lives in `core/domain/token.ts`, not in `features/auth/domain/`. Only the *implementation* (`JwtTokenService`, wrapping `@nestjs/jwt`) stays inside `features/auth/infrastructure/`.

```ts
// any feature's controller
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get()
findAll() { ... }
```

**Why.** This one was learned the hard way, not designed up front. The first version put the guard inside `features/auth/`. `UsersController` needed it, so it imported `@/features/auth`. `AuthModule` needed `VerifyUserCredentialsUseCase`, so it imported `@/features/users`. That closed a circular CommonJS `require()` loop: `users.controller.ts` → `auth/index.ts` → `auth.module.ts` → `users/index.ts` → `users.module.ts` → `users.controller.ts`. Node resolves a circular `require()` to whichever side is still mid-evaluation, so `JwtAuthGuard` came back `undefined` — and Nest's `@UseGuards()` decorator throws `InvalidDecoratorItemException` at boot, not at lint time. `@Global()` on `AuthModule` fixed Nest's DI-resolution circularity but did nothing for this — a plain JavaScript module cycle, one layer below anything Nest controls.

The fix is not a workaround; it's recognizing that a bearer-token guard was never really *auth business logic* — it's HTTP-layer plumbing every feature attaches, exactly like `to-http-exception.ts` already is. Moving the port to `core/` and the guard to `shared/http/` means `users.controller.ts` never touches `@/features/auth` at all, so the cycle can't exist. Full account: [ADR-0012](08-decisions.md#adr-0012--the-jwt-guard-lives-in-shared-not-in-the-auth-feature).

**When not to.** Not every guard belongs in `shared/` — only ones more than one feature needs, or ones a feature needs from *another* feature that also depends on it. A guard used by exactly one feature, with no risk of this cycle, can stay in that feature's `presentation/`.

---

## 16. Request DTOs validate; application DTOs stay plain

**What.** `application/dto/*.dto.ts` are framework-free interfaces, as pattern 9 describes. Where a controller accepts a body, a sibling class in `presentation/dto/*.request.ts` adds `class-validator` decorators and `implements` the application interface:

```ts
// application/dto/create-user.dto.ts — framework-free
export interface CreateUserDto {
  readonly email: string;
  readonly name: string;
  readonly password: string;
}

// presentation/dto/create-user.request.ts — validated, transport-only
export class CreateUserRequest implements CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(8) password!: string;
}
```

A global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` in `main.ts` enforces every request class.

**Why.** `class-validator` decorators are HTTP-transport concerns — they'd violate "domain and application stay free of frameworks" if they lived on the DTO the use case actually consumes. `implements CreateUserDto` is what keeps the two in sync: if the application DTO's shape changes, the request class fails to compile until it catches up, with zero runtime cost and no separate mapping step (they're structurally the same object).

---

## 17. Repository adapters translate known error codes, not raw exceptions

**What.** [`prisma-user.repository.ts`](../backend/src/features/users/infrastructure/repositories/prisma-user.repository.ts) checks `Prisma.PrismaClientKnownRequestError`'s `code` and maps specific ones to domain errors — `P2002` (unique constraint) → `ConflictError`, `P2025` (record not found) → `NotFoundError` — before falling back to `UnexpectedError` for everything else.

**Why.** This is pattern 6 (the error taxonomy) applied at a concrete adapter: the caller asked "does this email already exist?", not "what did the Postgres driver throw?" Translating by code, not by string-matching a message, survives Prisma version bumps and localized error text.

**When not to.** Don't special-case every Prisma error code you can imagine — only the ones a caller can meaningfully react to differently. Everything else is legitimately `UnexpectedError`.

---

## 18. Response DTOs mirror request DTOs, for the same reason

**What.** Just as `presentation/dto/*.request.ts` classes exist because `class-validator` decorators can't live on a framework-free application DTO, `presentation/dto/*.response.ts` classes exist because `@ApiProperty()` can't either. Both `implements` the same application-layer interface:

```ts
// application/dto/user.dto.ts — framework-free, one definition of the shape
export interface UserDto {
  readonly id: string;
  readonly email: string;
  ...
}

// presentation/dto/user.response.ts — documentation-only, no validation
export class UserResponse implements UserDto {
  @ApiProperty({ example: '81c00...' }) id!: string;
  @ApiProperty({ example: 'ada@example.com' }) email!: string;
  ...
}
```

The controller keeps returning the plain `UserDto` value from the use case — `@ApiResponse({ type: UserResponse })` only tells Swagger which schema to render for that status code; it has no effect on what actually gets serialized over the wire.

**Why.** An interface is erased at compile time, so `@nestjs/swagger`'s reflection-based decorators have nothing to introspect. The alternative — converting application DTOs to classes so they can carry `@ApiProperty()` directly — would pull `@nestjs/swagger` into `application/`, which the layering rule forbids for exactly the reason pattern 16 gives for `class-validator`. Duplicating the shape one layer out, with the compiler enforcing the two stay in sync via `implements`, costs one small file per DTO and keeps `application/` genuinely framework-free.

**Error responses don't get this treatment per endpoint.** `toHttpException` always produces the same `{ statusCode, code, message }` shape regardless of which `AppError` triggered it, so there is exactly one class for it — [`ApiErrorResponse`](../backend/src/shared/http/api-error-response.ts) — that every `@ApiResponse` for a failure case points at, rather than a bespoke error-response class per feature.

**When not to.** If a project adopts the `@nestjs/swagger` CLI plugin (static analysis at build time, configured in `nest-cli.json`), it can often infer property metadata directly from interfaces and controller return types, making manual response classes unnecessary. This project doesn't use the plugin, to keep the build a single `tsc` pass — but it's the natural next step if the manual-decoration boilerplate starts to hurt.

---

## 19. List endpoints: a generic `Paginated<T>`, a feature-specific query, `@ApiQuery` instead of `@ApiProperty`

**What.** `GET /users` (see [`get-users.use-case.ts`](../backend/src/features/users/application/use-cases/get-users.use-case.ts), [`prisma-user.repository.ts`](../backend/src/features/users/infrastructure/repositories/prisma-user.repository.ts)) is the house shape for "list with search, filter, sort, and pagination":

```ts
// core/domain/pagination.ts — generic, framework-free, any feature can return one
export interface Paginated<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

// features/users/domain/repositories/user.repository.ts — feature-specific query shape
export interface UserListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;         // matched against name OR email
  readonly createdFrom?: Date;      // a genuine filter, distinct from search
  readonly createdTo?: Date;
  readonly sortBy: UserSortField;   // a closed enum of sortable columns, not a free string
  readonly sortOrder: SortOrder;
}
findAll(query: UserListQuery): Promise<Result<Paginated<User>, AppError>>;
```

`Paginated<T>` lives in `core/` because the envelope has zero user-specific fields — the next feature that lists something reuses it rather than reinventing the same four properties. `UserListQuery` stays in the feature, because *which* columns are sortable and *what* counts as a filter is feature-specific.

**Where defaults and clamping live.** The use case, not the controller: `GetUsersUseCase.execute()` takes an all-optional `GetUsersQueryDto` and fills in `page: 1`, `pageSize: 20` (capped at 100), `sortBy: 'createdAt'`, `sortOrder: 'asc'` before calling the repository. This keeps `execute({})` meaningful when a test (or a future caller) calls the use case directly, without going through HTTP. The presentation-layer `GetUsersRequest` (pattern 16) still separately rejects an out-of-range `pageSize` or an unrecognized `sortBy` with `400` — the use case's clamp is a defense-in-depth default, not the primary validation.

**Why `@ApiQuery` instead of `@ApiProperty` here.** Pattern 16 and 18 use `@ApiProperty()` on request/response classes because `@nestjs/swagger` reflects those automatically for `@Body()` parameters and return types. It does **not** do the same for a class bound with `@Query()` — without the CLI plugin (see [05-technologies](05-technologies.md)), decorating `GetUsersRequest`'s fields with `@ApiProperty()` would be dead code. Each query param is documented instead with its own `@ApiQuery({ name: 'page', ... })` on the controller method, the same manual treatment `:id` already gets from `@ApiParam`.

**When not to.** Don't reach for `createdFrom`/`createdTo`-style filters for every column just because the pattern exists — add a filter when there's a real caller need for it, the same restraint pattern 17 applies to Prisma error codes. See [ADR-0017](08-decisions.md#adr-0017--search-filter-sort-and-pagination-on-get-users) for the specific defaults and why they're what they are.

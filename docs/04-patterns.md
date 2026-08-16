# 04 — Patterns

> Last updated: 2026-08-16

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

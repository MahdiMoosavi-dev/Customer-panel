/**
 * Public API of the auth feature: the login flow. `JwtAuthGuard` and
 * `TokenPayload` are not re-exported here — they live in `@/shared/http`
 * and `@/core` respectively, since they are cross-cutting HTTP/domain
 * primitives rather than something specific to logging in. Import them
 * from there directly. See docs/08-decisions.md.
 */
export { AuthModule } from './infrastructure/auth.module';
export type { AuthTokenDto } from './application/dto/auth-token.dto';

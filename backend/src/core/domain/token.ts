import type { AppError } from './app-error';
import type { Result } from './result';

/** The claims carried inside an access token. */
export interface TokenPayload {
  readonly sub: string;
  readonly email: string;
}

/**
 * Port for issuing and verifying access tokens. A cross-cutting contract —
 * like `Result`/`AppError` — since any feature may end up guarding a route.
 * The JWT adapter that implements it lives in `features/auth/infrastructure/`.
 */
export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<Result<TokenPayload, AppError>>;
}

/** DI token, since an interface does not survive compilation. */
export const TOKEN_SERVICE = Symbol('TokenService');

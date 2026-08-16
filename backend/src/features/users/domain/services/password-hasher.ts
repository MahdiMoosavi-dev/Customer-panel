/**
 * Port for turning a plain-text password into something safe to store, and
 * back-checking a plain-text password against a stored hash. The bcrypt
 * adapter lives in infrastructure — the domain only knows this contract.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

/** DI token, since an interface does not survive compilation. */
export const PASSWORD_HASHER = Symbol('PasswordHasher');

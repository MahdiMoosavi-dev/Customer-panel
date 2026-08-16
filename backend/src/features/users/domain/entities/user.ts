import { err, ok, ValidationError, type Result } from '@/core';

/** A persisted user. */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Validated data ready to be persisted as a new user. */
export interface NewUser {
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
}

export interface NewUserInput {
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Factory that enforces the entity's invariants: email is normalized and
 * must look like an email, and a name is required. The password must
 * already be hashed — hashing is a `PasswordHasher` concern, not the
 * entity's, since the domain must stay free of that library.
 */
export function createUser(
  input: NewUserInput,
): Result<NewUser, ValidationError> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!EMAIL_PATTERN.test(email)) {
    return err(new ValidationError('A valid email is required.'));
  }

  if (name.length === 0) {
    return err(new ValidationError('A name is required.'));
  }

  if (input.passwordHash.length === 0) {
    return err(new ValidationError('A password hash is required.'));
  }

  return ok({ email, name, passwordHash: input.passwordHash });
}

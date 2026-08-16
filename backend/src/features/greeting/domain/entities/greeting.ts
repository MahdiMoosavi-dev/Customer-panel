import { err, ok, ValidationError, type Result } from '@/core';

/** The single piece of content this feature owns. */
export interface Greeting {
  readonly headline: string;
  readonly message: string;
}

export interface GreetingInput {
  readonly headline: string;
  readonly message: string;
}

/**
 * Factory that enforces the entity's invariants: a greeting without a
 * headline is not a greeting, so it can never be constructed.
 */
export function createGreeting(
  input: GreetingInput,
): Result<Greeting, ValidationError> {
  const headline = input.headline.trim();
  const message = input.message.trim();

  if (headline.length === 0) {
    return err(new ValidationError('A greeting requires a headline.'));
  }

  return ok({ headline, message });
}

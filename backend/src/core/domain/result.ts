/**
 * Explicit success/failure value used across layer boundaries so that
 * use cases never leak thrown exceptions into the presentation layer.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { ok: true; value: T } {
  return result.ok;
}

/** Maps the success value while passing any failure through untouched. */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  map: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(map(result.value)) : result;
}

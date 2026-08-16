/**
 * Base class for errors the application understands. Infrastructure failures
 * should be translated into one of these before crossing back into the
 * application layer; the HTTP layer maps them to status codes.
 */
export abstract class AppError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
}

export class UnexpectedError extends AppError {
  readonly code = 'UNEXPECTED_ERROR';
}

/**
 * Domain error hierarchy. Services throw these instead of HttpExceptions so the
 * business layer stays transport-agnostic; the exception filter maps them to
 * HTTP responses. Each carries a stable machine-readable `code`.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_FAILED';
  readonly httpStatus = 422;
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly httpStatus = 401;
}

/** Raised when a request lifecycle transition is not permitted. */
export class InvalidTransitionError extends DomainError {
  readonly code = 'INVALID_TRANSITION';
  readonly httpStatus = 409;
}

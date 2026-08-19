/**
 * Centralized error classes with consistent HTTP status + error codes.
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code ?? `HTTP_${status}`;
    this.details = details;
  }
}

export class AuthError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message, "AUTH_ERROR");
    this.name = "AuthError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Permission denied") {
    super(403, message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class UnprocessableError extends ApiError {
  constructor(message = "Unprocessable entity", details?: unknown) {
    super(422, message, "UNPROCESSABLE_ENTITY", details);
    this.name = "UnprocessableError";
  }
}
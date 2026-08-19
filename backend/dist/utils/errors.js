"use strict";
/**
 * Centralized error classes with consistent HTTP status + error codes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnprocessableError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthError = exports.ApiError = void 0;
class ApiError extends Error {
    status;
    code;
    details;
    constructor(status, message, code, details) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code ?? `HTTP_${status}`;
        this.details = details;
    }
}
exports.ApiError = ApiError;
class AuthError extends ApiError {
    constructor(message = "Unauthorized") {
        super(401, message, "AUTH_ERROR");
        this.name = "AuthError";
    }
}
exports.AuthError = AuthError;
class ForbiddenError extends ApiError {
    constructor(message = "Permission denied") {
        super(403, message, "FORBIDDEN");
        this.name = "ForbiddenError";
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends ApiError {
    constructor(message = "Resource not found") {
        super(404, message, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends ApiError {
    constructor(message = "Conflict") {
        super(409, message, "CONFLICT");
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends ApiError {
    constructor(message = "Validation failed", details) {
        super(400, message, "VALIDATION_ERROR", details);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class UnprocessableError extends ApiError {
    constructor(message = "Unprocessable entity", details) {
        super(422, message, "UNPROCESSABLE_ENTITY", details);
        this.name = "UnprocessableError";
    }
}
exports.UnprocessableError = UnprocessableError;
//# sourceMappingURL=errors.js.map
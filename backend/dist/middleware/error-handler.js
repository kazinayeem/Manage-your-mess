"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    if (err instanceof errors_1.ApiError) {
        return (0, response_1.sendError)(res, err.message, err.code, err.details, err.status);
    }
    // Handle SyntaxError or Zod errors if unhandled
    if (err.name === "ZodError") {
        return (0, response_1.sendError)(res, "Validation failed", "VALIDATION_ERROR", err, 400);
    }
    console.error("[Unhandled Error]:", err);
    return (0, response_1.sendError)(res, process.env.NODE_ENV === "production" ? "Internal server error" : err.message, "INTERNAL_SERVER_ERROR", undefined, 500);
}
//# sourceMappingURL=error-handler.js.map
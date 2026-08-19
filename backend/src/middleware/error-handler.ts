import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors";
import { sendError } from "../utils/response";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.code, err.details, err.status);
  }

  // Handle SyntaxError or Zod errors if unhandled
  if (err.name === "ZodError") {
    return sendError(res, "Validation failed", "VALIDATION_ERROR", err, 400);
  }

  console.error("[Unhandled Error]:", err);
  return sendError(
    res,
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    "INTERNAL_SERVER_ERROR",
    undefined,
    500
  );
}

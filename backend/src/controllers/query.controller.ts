import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess } from "../utils/response";

const ALLOWED_MODELS = new Set(Object.keys(Prisma.ModelName));
const ALLOWED_ACTIONS = new Set([
  "findMany",
  "findUnique",
  "findFirst",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "create",
  "delete",
  "upsert",
  "updateMany",
  "createMany",
  "deleteMany",
]);

export async function runQuery(req: Request, res: Response) {
  const { model, action, args } = (req.body ?? {}) as {
    model?: string;
    action?: string;
    args?: Record<string, unknown>;
  };

  if (!model || !ALLOWED_MODELS.has(model)) {
    throw new ValidationError("Model not allowed");
  }
  if (!action || !ALLOWED_ACTIONS.has(action)) {
    throw new ValidationError("Action not allowed");
  }

  const delegate = (prisma as unknown as Record<string, Record<string, unknown>>)[model];
  const method = delegate?.[action];
  if (typeof method !== "function") {
    throw new ValidationError("Model action not found");
  }

  try {
    const data = await (method as (a?: unknown) => Promise<unknown>)(args ?? {});
    return sendSuccess(res, data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Record not found");
      if (error.code === "P2002") throw new ConflictError("Unique constraint violation");
    }
    throw error;
  }
}

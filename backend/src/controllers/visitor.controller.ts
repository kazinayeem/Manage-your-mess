import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getVisitors(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const visitors = await prisma.visitor.findMany({
    where: { messId },
    orderBy: { entryAt: "desc" },
  });

  return sendList(res, visitors, { total: visitors.length });
}

export async function createVisitor(req: Request, res: Response) {
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const { name, phone, purpose, entryAt } = req.body;
  if (!name) throw new ValidationError("Name is required");

  const visitor = await prisma.visitor.create({
    data: {
      messId,
      name,
      phone,
      purpose,
      entryAt: entryAt ? new Date(entryAt) : new Date(),
    },
  });

  return sendSuccess(res, visitor, "Visitor logged", 201);
}

import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getBills(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const bills = await prisma.bill.findMany({
    where: { messId, deletedAt: null },
    include: {
      createdBy: { select: { name: true } },
      memberShares: {
        include: { member: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { billingMonth: "desc" },
  });

  return sendList(res, bills, { total: bills.length });
}

export async function createBill(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const { category, amount, description, billingMonth, splitMethod } = req.body;
  if (!category || !amount) throw new ValidationError("Category and amount required");

  const bill = await prisma.bill.create({
    data: {
      messId,
      category,
      amount: Number(amount),
      description,
      billingMonth: billingMonth ? new Date(billingMonth) : new Date(),
      splitMethod: splitMethod || "EQUAL",
      createdById: req.user.id,
      status: "PENDING",
    },
  });

  return sendSuccess(res, bill, "Utility bill created", 201);
}

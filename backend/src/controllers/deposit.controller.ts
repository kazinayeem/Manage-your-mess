import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getDeposits(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where: { messId, deletedAt: null },
      include: {
        member: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.deposit.count({ where: { messId, deletedAt: null } }),
  ]);

  return sendList(res, deposits, { page, limit, total });
}

export async function createDeposit(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const { memberId, amount, method, reference, notes } = req.body;
  const targetMemberId = memberId || req.user.memberId;

  if (!targetMemberId || !amount || !method) {
    throw new ValidationError("Member, amount, and payment method are required");
  }

  const deposit = await prisma.deposit.create({
    data: {
      messId,
      memberId: targetMemberId,
      amount: Number(amount),
      method: method as any,
      reference,
      notes,
      status: "APPROVED",
      createdById: req.user.id,
      approvedById: req.user.id,
      approvedAt: new Date(),
    },
    include: {
      member: { include: { user: { select: { name: true } } } },
    },
  });

  // Update member total deposit balance
  await prisma.member.update({
    where: { id: targetMemberId },
    data: { totalDeposit: { increment: Number(amount) } },
  });

  return sendSuccess(res, deposit, "Deposit submitted successfully", 201);
}

export async function updateDepositStatus(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { id } = req.params;
  const { status } = req.body;

  const deposit = await prisma.deposit.update({
    where: { id },
    data: {
      status,
      approvedById: req.user.id,
      approvedAt: new Date(),
    },
  });

  return sendSuccess(res, deposit, `Deposit status updated to ${status}`);
}

import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { requireMessAccess } from "../services/access.service";
import { recalculateMonth, logFinancialTransaction } from "../services/financial.service";

export async function getDeposits(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "DEPOSIT_READ");

  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const monthId = req.query.monthId as string | undefined;

  const where: any = { messId, deletedAt: null };
  if (monthId) where.monthId = monthId;

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where,
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
    prisma.deposit.count({ where }),
  ]);

  return sendList(res, deposits, { page, limit, total });
}

export async function createDeposit(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "DEPOSIT_CREATE");

  const { memberId, amount, method, type, reference, notes, monthId } = req.body;
  if (!memberId || !amount || !method) {
    throw new ValidationError("Member, amount, and payment method are required");
  }

  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: { currentMonth: true },
  });
  if (!mess) throw new NotFoundError("Mess not found");

  const targetMonthId = monthId || mess.currentMonthId;

  const deposit = await prisma.$transaction(async (tx) => {
    const created = await tx.deposit.create({
      data: {
        messId,
        monthId: targetMonthId,
        memberId,
        amount: Number(amount),
        method: method as any,
        type: type || "MONTHLY",
        reference,
        notes,
        status: "APPROVED",
        createdById: req.user!.id,
        approvedById: req.user!.id,
        approvedAt: new Date(),
      },
      include: {
        member: { include: { user: { select: { name: true } } } },
      },
    });

    await tx.financialTransaction.create({
      data: {
        messId,
        monthId: targetMonthId,
        type: "DEPOSIT",
        amount: Number(amount),
        memberId,
        createdById: req.user!.id,
        referenceId: created.id,
        referenceType: "Deposit",
        description: notes || `Deposit of ${amount} BDT by ${created.member.fullName || "Member"}`,
      },
    });

    await tx.auditLog.create({
      data: {
        messId,
        userId: req.user!.id,
        action: "CREATE",
        entity: "Deposit",
        entityId: created.id,
        newData: JSON.stringify({ amount, method, memberId }),
      },
    });

    return created;
  });

  if (targetMonthId) {
    await recalculateMonth(messId, targetMonthId);
  }

  return sendSuccess(res, deposit, "Deposit recorded successfully", 201);
}

export async function updateDeposit(req: Request, res: Response) {
  const { id } = req.params;
  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit || deposit.deletedAt) throw new NotFoundError("Deposit not found");

  await requireMessAccess(req.user!, deposit.messId, "DEPOSIT_CREATE");

  const { amount, method, type, reference, notes, status } = req.body;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.deposit.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(method !== undefined && { method }),
        ...(type !== undefined && { type }),
        ...(reference !== undefined && { reference }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });

    await tx.auditLog.create({
      data: {
        messId: deposit.messId,
        userId: req.user!.id,
        action: "UPDATE",
        entity: "Deposit",
        entityId: id,
        newData: JSON.stringify(req.body),
      },
    });

    return u;
  });

  if (deposit.monthId) {
    await recalculateMonth(deposit.messId, deposit.monthId);
  }

  return sendSuccess(res, updated, "Deposit updated successfully");
}

export async function deleteDeposit(req: Request, res: Response) {
  const { id } = req.params;
  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit || deposit.deletedAt) throw new NotFoundError("Deposit not found");

  await requireMessAccess(req.user!, deposit.messId, "DEPOSIT_CREATE");

  await prisma.$transaction(async (tx) => {
    await tx.deposit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        messId: deposit.messId,
        userId: req.user!.id,
        action: "DELETE",
        entity: "Deposit",
        entityId: id,
      },
    });
  });

  if (deposit.monthId) {
    await recalculateMonth(deposit.messId, deposit.monthId);
  }

  return sendSuccess(res, null, "Deposit deleted successfully");
}

import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { requireMessAccess } from "../services/access.service";
import { recalculateMonth, logFinancialTransaction } from "../services/financial.service";

export async function getExpenses(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "EXPENSE_READ");

  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const search = req.query.search as string;
  const monthId = req.query.monthId as string;

  const where: any = { messId, deletedAt: null };
  if (monthId) where.monthId = monthId;
  if (search) {
    where.description = { contains: search };
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, isMealCost: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return sendList(res, expenses, { page, limit, total });
}

export async function getCategories(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);

  const categories = await prisma.expenseCategory.findMany({
    where: {
      OR: [{ isDefault: true }, ...(messId ? [{ messId }] : [])],
      deletedAt: null,
    },
  });

  return sendList(res, categories, { total: categories.length });
}

export async function createExpense(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "EXPENSE_CREATE");

  const { categoryId, amount, description, date, receiptUrl, monthId } = req.body;
  if (!amount || !categoryId) throw new ValidationError("Amount and category are required");

  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: { currentMonth: true },
  });
  if (!mess) throw new NotFoundError("Mess not found");

  const targetMonthId = monthId || mess.currentMonthId;

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        messId,
        monthId: targetMonthId,
        categoryId,
        amount: Number(amount),
        description,
        receiptUrl,
        date: date ? new Date(date) : new Date(),
        createdById: req.user!.id,
        status: "APPROVED",
        approvedById: req.user!.id,
        approvedAt: new Date(),
      },
      include: { category: true, createdBy: { select: { name: true } } },
    });

    await tx.financialTransaction.create({
      data: {
        messId,
        monthId: targetMonthId,
        type: created.category.isMealCost ? "BAZAAR_COST" : "EXPENSE",
        amount: Number(amount),
        createdById: req.user!.id,
        referenceId: created.id,
        referenceType: "Expense",
        description: description || `Expense for ${created.category.name}`,
      },
    });

    await tx.auditLog.create({
      data: {
        messId,
        userId: req.user!.id,
        action: "CREATE",
        entity: "Expense",
        entityId: created.id,
        newData: JSON.stringify({ amount, categoryId, description }),
      },
    });

    return created;
  });

  if (targetMonthId) {
    await recalculateMonth(messId, targetMonthId);
  }

  return sendSuccess(res, expense, "Expense created successfully", 201);
}

export async function approveExpense(req: Request, res: Response) {
  const { id } = req.params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.deletedAt) throw new NotFoundError("Expense not found");

  await requireMessAccess(req.user!, expense.messId, "EXPENSE_APPROVE");

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: req.user!.id,
      approvedAt: new Date(),
    },
  });

  if (expense.monthId) {
    await recalculateMonth(expense.messId, expense.monthId);
  }

  return sendSuccess(res, updated, "Expense approved");
}

export async function deleteExpense(req: Request, res: Response) {
  const { id } = req.params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.deletedAt) throw new NotFoundError("Expense not found");

  await requireMessAccess(req.user!, expense.messId, "EXPENSE_DELETE");

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        messId: expense.messId,
        userId: req.user!.id,
        action: "DELETE",
        entity: "Expense",
        entityId: id,
      },
    });
  });

  if (expense.monthId) {
    await recalculateMonth(expense.messId, expense.monthId);
  }

  return sendSuccess(res, null, "Expense deleted successfully");
}

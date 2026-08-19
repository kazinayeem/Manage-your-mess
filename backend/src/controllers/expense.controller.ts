import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getExpenses(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const search = req.query.search as string;

  const where: any = { messId, deletedAt: null };
  if (search) {
    where.description = { contains: search, mode: "insensitive" };
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
  const messId = req.activeMessId || (req.query.messId as string);

  const categories = await prisma.expenseCategory.findMany({
    where: {
      OR: [{ isDefault: true }, { messId }],
      deletedAt: null,
    },
  });

  return sendList(res, categories, { total: categories.length });
}

export async function createExpense(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const { categoryId, amount, description, date, receiptUrl } = req.body;
  if (!amount || !categoryId) throw new ValidationError("Amount and category are required");

  const expense = await prisma.expense.create({
    data: {
      messId,
      categoryId,
      amount: Number(amount),
      description,
      receiptUrl,
      date: date ? new Date(date) : new Date(),
      createdById: req.user.id,
      status: "APPROVED", // Default auto-approve for managers or logged-in member creating expense
    },
    include: { category: true, createdBy: { select: { name: true } } },
  });

  return sendSuccess(res, expense, "Expense created successfully", 201);
}

export async function approveExpense(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { id } = req.params;

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: req.user.id,
      approvedAt: new Date(),
    },
  });

  return sendSuccess(res, expense, "Expense approved");
}

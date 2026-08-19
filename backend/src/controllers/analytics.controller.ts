import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { ValidationError } from "../utils/errors";
import { sendSuccess } from "../utils/response";

export async function getDashboardAnalytics(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const [
    totalMembers,
    expensesAggregate,
    depositsAggregate,
    mealsAggregate,
    recentExpenses,
    membersList,
  ] = await Promise.all([
    prisma.member.count({ where: { messId, deletedAt: null, status: "ACTIVE" } }),
    prisma.expense.aggregate({
      where: { messId, deletedAt: null, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.deposit.aggregate({
      where: { messId, deletedAt: null, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.mealEntry.aggregate({
      where: { messId },
      _sum: { breakfast: true, lunch: true, dinner: true },
    }),
    prisma.expense.findMany({
      where: { messId, deletedAt: null },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: { select: { name: true } } },
    }),
    prisma.member.findMany({
      where: { messId, deletedAt: null },
      select: { totalDue: true, totalDeposit: true },
    }),
  ]);

  const totalExpense = expensesAggregate._sum.amount || 0;
  const totalDeposit = depositsAggregate._sum.amount || 0;
  const totalMeals =
    (mealsAggregate._sum.breakfast || 0) +
    (mealsAggregate._sum.lunch || 0) +
    (mealsAggregate._sum.dinner || 0);

  const mealRate = totalMeals > 0 ? Number((totalExpense / totalMeals).toFixed(2)) : 0;
  const totalDues = membersList.reduce((acc, m) => acc + (m.totalDue || 0), 0);

  return sendSuccess(res, {
    totalMembers,
    totalExpense,
    totalDeposit,
    totalMeals,
    mealRate,
    totalDues,
    recentExpenses,
  });
}

export async function getExpenseTrend(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  // Get expenses grouped by date (or category)
  const expenses = await prisma.expense.findMany({
    where: { messId, deletedAt: null },
    select: { amount: true, date: true, category: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  return sendSuccess(res, expenses);
}

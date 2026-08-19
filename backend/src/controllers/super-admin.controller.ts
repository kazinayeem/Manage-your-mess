import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess } from "../utils/response";

export async function getPlatformOverview(req: Request, res: Response) {
  const [totalUsers, totalMesses, activeSubscriptions, totalExpenses] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.mess.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.expense.aggregate({
      where: { status: "APPROVED", deletedAt: null },
      _sum: { amount: true },
    }),
  ]);

  return sendSuccess(res, {
    totalUsers,
    totalMesses,
    activeSubscriptions,
    totalPlatformExpense: totalExpenses._sum.amount || 0,
  });
}

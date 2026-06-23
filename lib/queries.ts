import "server-only";

import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function getDashboardStats(messId: string) {
  const cacheKey = `dashboard:${messId}`;
  const cached = await cacheGet<ReturnType<typeof computeDashboardStats>>(cacheKey);
  if (cached) return cached;

  const stats = await computeDashboardStats(messId);
  await cacheSet(cacheKey, stats, 60);
  return stats;
}

async function computeDashboardStats(messId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    mess,
    memberCount,
    monthlyExpenses,
    monthlyDeposits,
    expenseTrend,
    depositTrend,
  ] = await Promise.all([
    db.mess.findUnique({ where: { id: messId } }),
    db.member.count({ where: { messId, status: "ACTIVE", deletedAt: null } }),
    db.expense.aggregate({
      where: {
        messId,
        status: "APPROVED",
        date: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
    }),
    db.deposit.aggregate({
      where: {
        messId,
        status: "APPROVED",
        createdAt: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
    }),
    getMonthlyTrend(messId, "expense"),
    getMonthlyTrend(messId, "deposit"),
  ]);

  const totalDue = await db.member.aggregate({
    where: { messId, deletedAt: null },
    _sum: { totalDue: true },
  });

  return {
    totalMembers: memberCount,
    totalMeals: mess?.totalMeals ?? 0,
    monthlyExpenses: monthlyExpenses._sum.amount ?? 0,
    monthlyDeposits: monthlyDeposits._sum.amount ?? 0,
    mealRate: mess?.mealRate ?? 0,
    totalDue: totalDue._sum.totalDue ?? 0,
    expenseTrend,
    depositTrend,
  };
}

async function getMonthlyTrend(messId: string, type: "expense" | "deposit") {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, "MMM"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const results = await Promise.all(
    months.map(async ({ month, start, end }) => {
      let amount = 0;
      if (type === "expense") {
        const r = await db.expense.aggregate({
          where: { messId, status: "APPROVED", date: { gte: start, lte: end }, deletedAt: null },
          _sum: { amount: true },
        });
        amount = r._sum.amount ?? 0;
      } else {
        const r = await db.deposit.aggregate({
          where: { messId, status: "APPROVED", createdAt: { gte: start, lte: end }, deletedAt: null },
          _sum: { amount: true },
        });
        amount = r._sum.amount ?? 0;
      }
      return { month, amount };
    })
  );

  return results;
}

export async function getUserMesses(userId: string) {
  return db.member.findMany({
    where: { userId, deletedAt: null, status: { in: ["ACTIVE", "PENDING"] } },
    include: {
      mess: {
        include: {
          subscription: {
            select: {
              id: true,
              status: true,
              currentPeriodEnd: true,
              plan: {
                select: {
                  id: true,
                  slug: true,
                  tier: true,
                  name: true,
                  description: true,
                  price: true,
                  currency: true,
                  durationType: true,
                  durationValue: true,
                  customExpiryDate: true,
                  maxMembers: true,
                  limits: true,
                  features: true,
                  featureToggles: true,
                  isActive: true,
                  isDefault: true,
                  isPopular: true,
                  sortOrder: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMessMembers(messId: string) {
  return db.member.findMany({
    where: { messId, deletedAt: null },
    include: { user: { select: { email: true, image: true } }, bed: { include: { room: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMessExpenses(messId: string) {
  return db.expense.findMany({
    where: { messId, deletedAt: null },
    include: { category: true, createdBy: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });
}

export async function getMessDeposits(messId: string) {
  return db.deposit.findMany({
    where: { messId, deletedAt: null },
    include: { member: { select: { fullName: true } }, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getAdminStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    totalUsers,
    activeUsers,
    totalMesses,
    totalBranches,
    totalMembers,
    activeSubscriptions,
    expiredSubscriptions,
    trialAccounts,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    monthlyRevenue,
    annualRevenue,
    paidInvoices,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null, isActive: true, lastLoginAt: { gte: subMonths(now, 1) } } }),
    db.mess.count({ where: { deletedAt: null } }),
    db.branch.count({ where: { deletedAt: null } }),
    db.member.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "EXPIRED" } }),
    db.subscription.count({ where: { status: "TRIALING" } }),
    db.subscriptionPaymentRequest.count({ where: { status: "PENDING" } }),
    db.subscriptionPaymentRequest.count({ where: { status: "APPROVED" } }),
    db.subscriptionPaymentRequest.count({ where: { status: "REJECTED" } }),
    db.invoice.aggregate({
      where: { status: "paid", paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: { status: "paid", paidAt: { gte: yearStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
  ]);

  const mrr = monthlyRevenue._sum.amount ?? 0;
  const arr = (annualRevenue._sum.amount ?? 0) || mrr * 12;

  return {
    totalUsers,
    activeUsers,
    totalMesses,
    totalBranches,
    totalMembers,
    monthlyRevenue: mrr,
    annualRevenue: arr,
    activeSubscriptions,
    expiredSubscriptions,
    trialAccounts,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    totalRevenue: paidInvoices._sum.amount ?? 0,
    mrr,
    arr,
    churnRate: 0,
    conversionRate: 0,
  };
}

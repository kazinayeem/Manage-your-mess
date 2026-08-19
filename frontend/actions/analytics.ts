"use server";

import { db } from "@/lib/db";
import { requireMessAccess } from "@/lib/mess-access";
import { requireSuperAdmin } from "@/lib/billing/auth";
import { getMonthSummary } from "@/actions/monthly";
import { getBillCategoryLabel } from "@/lib/bills/categories";
import type { BillCategoryType } from "@prisma/client";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export type AnalyticsRange =
  | "today"
  | "week"
  | "month"
  | "last_month"
  | "3months"
  | "6months"
  | "year"
  | "custom";

function rangeToDates(range: AnalyticsRange) {
  const now = new Date();
  const end = endOfMonth(now);
  let start = startOfMonth(now);
  switch (range) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      return { start, end: new Date() };
    case "week":
      start = new Date();
      start.setDate(start.getDate() - 7);
      return { start, end: new Date() };
    case "last_month":
      return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case "3months":
      return { start: startOfMonth(subMonths(now, 2)), end };
    case "6months":
      return { start: startOfMonth(subMonths(now, 5)), end };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end };
    default:
      return { start: startOfMonth(now), end };
  }
}

export async function getSuperAdminAnalytics(range: AnalyticsRange = "year") {
  await requireSuperAdmin();
  const now = new Date();
  const stats = await getPlatformStats();

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return { label: format(d, "MMM yy"), start: startOfMonth(d), end: endOfMonth(d) };
  });

  const revenueTrend = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const r = await db.invoice.aggregate({
        where: { status: "paid", paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
      });
      return { month: label, revenue: r._sum.amount ?? 0 };
    })
  );

  const plans = await db.plan.findMany({ where: { isActive: true } });
  const subscriptionDist = await Promise.all(
    plans.map(async (p) => ({
      name: p.name,
      value: await db.subscription.count({ where: { planId: p.id, status: "ACTIVE" } }),
    }))
  );

  const userGrowth = await Promise.all(
    months.slice(-6).map(async ({ label, start, end }) => ({
      month: label,
      users: await db.user.count({ where: { createdAt: { gte: start, lte: end }, deletedAt: null } }),
    }))
  );

  const topMesses = await db.mess.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, _count: { select: { members: true } } },
    orderBy: { members: { _count: "desc" } },
    take: 10,
  });

  const paymentMethods = await db.paymentMethod.findMany({ where: { isActive: true } });
  const paymentUsage = await Promise.all(
    paymentMethods.map(async (m) => ({
      name: m.name,
      value: await db.subscriptionPaymentRequest.count({
        where: { paymentMethodId: m.id, status: "APPROVED" },
      }),
    }))
  );

  const tickets = await db.supportTicket.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const funnel = {
    registered: await db.user.count({ where: { deletedAt: null } }),
    trial: await db.subscription.count({ where: { status: "TRIALING" } }),
    paid: await db.subscription.count({ where: { status: "ACTIVE" } }),
    renewed: await db.subscription.count({ where: { cancelAtPeriodEnd: false, status: "ACTIVE" } }),
  };

  return {
    range,
    overview: stats,
    revenueTrend,
    subscriptionDist: subscriptionDist.filter((s) => s.value > 0),
    userGrowth,
    topMesses: topMesses.map((m) => ({ name: m.name, members: m._count.members })),
    paymentUsage: paymentUsage.filter((p) => p.value > 0),
    tickets: tickets.map((t) => ({ status: t.status, count: t._count.status })),
    funnel,
    insights: buildSuperAdminInsights(stats),
  };
}

async function getPlatformStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    totalUsers,
    activeUsers,
    totalMesses,
    totalMembers,
    activeSubscriptions,
    expiredSubscriptions,
    pendingPayments,
    approvedPayments,
    monthlyRevenue,
    annualRevenue,
    totalRevenue,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null, isActive: true } }),
    db.mess.count({ where: { deletedAt: null } }),
    db.member.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "EXPIRED" } }),
    db.subscriptionPaymentRequest.count({ where: { status: "PENDING" } }),
    db.subscriptionPaymentRequest.count({ where: { status: "APPROVED" } }),
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

  return {
    totalUsers,
    activeUsers,
    totalMesses,
    totalMembers,
    monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    annualRevenue: annualRevenue._sum.amount ?? 0,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    activeSubscriptions,
    expiredSubscriptions,
    pendingPayments,
    approvedPayments,
  };
}

function buildSuperAdminInsights(stats: Awaited<ReturnType<typeof getPlatformStats>>) {
  const insights: string[] = [];
  if (stats.pendingPayments > 0) {
    insights.push(`${stats.pendingPayments} payment requests awaiting approval.`);
  }
  if (stats.expiredSubscriptions > 0) {
    insights.push(`${stats.expiredSubscriptions} subscriptions have expired.`);
  }
  insights.push(`${stats.activeUsers} active users across ${stats.totalMesses} messes.`);
  return insights;
}

export async function getMessAnalytics(messId: string, range: AnalyticsRange = "6months") {
  await requireMessAccess(messId, "REPORT_VIEW");
  const { start, end } = rangeToDates(range);

  const mess = await db.mess.findFirst({
    where: { id: messId, deletedAt: null },
    include: { currentMonth: true },
  });
  if (!mess?.currentMonthId) throw new Error("No active month");

  const summary = await getMonthSummary(messId, mess.currentMonthId);
  if (!summary) throw new Error("Could not load summary");

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { label: format(d, "MMM"), start: startOfMonth(d), end: endOfMonth(d) };
  });

  const expenseTrend = await Promise.all(
    months.map(async ({ label, start: s, end: e }) => {
      const r = await db.expense.aggregate({
        where: { messId, status: "APPROVED", date: { gte: s, lte: e }, deletedAt: null },
        _sum: { amount: true },
      });
      return { month: label, amount: r._sum.amount ?? 0 };
    })
  );

  const depositTrend = await Promise.all(
    months.map(async ({ label, start: s, end: e }) => {
      const r = await db.deposit.aggregate({
        where: { messId, status: "APPROVED", createdAt: { gte: s, lte: e }, deletedAt: null },
        _sum: { amount: true },
      });
      return { month: label, amount: r._sum.amount ?? 0 };
    })
  );

  const expenseBreakdown = Object.entries(summary.billsByCategory)
    .filter(([, v]) => v > 0)
    .map(([cat, amount]) => ({
      name: getBillCategoryLabel(cat as BillCategoryType),
      value: amount,
    }));

  const mealEntries = await db.mealEntry.findMany({
    where: { messId, meal: { date: { gte: start, lte: end } } },
    select: { breakfast: true, lunch: true, dinner: true, meal: { select: { date: true } } },
  });

  const mealByMonth = months.map(({ label, start: s, end: e }) => {
    const entries = mealEntries.filter((m) => m.meal.date >= s && m.meal.date <= e);
    return {
      month: label,
      breakfast: entries.reduce((a, m) => a + m.breakfast, 0),
      lunch: entries.reduce((a, m) => a + m.lunch, 0),
      dinner: entries.reduce((a, m) => a + m.dinner, 0),
    };
  });

  const depositRanking = [...summary.members]
    .sort((a, b) => b.totalDeposit - a.totalDeposit)
    .slice(0, 8)
    .map((m) => ({ name: m.fullName ?? "Member", deposit: m.totalDeposit }));

  const dueRanking = [...summary.members]
    .filter((m) => m.due > 0)
    .sort((a, b) => b.due - a.due)
    .slice(0, 8)
    .map((m) => ({ name: m.fullName ?? "Member", due: m.due }));

  const utilityTrend = months.map(({ label, start: s, end: e }) => {
    const bills = summary.bills.filter((b) => b.billingMonth >= s && b.billingMonth <= e);
    const pick = (cats: string[]) =>
      bills.filter((b) => cats.includes(b.category)).reduce((a, b) => a + b.amount, 0);
    return {
      month: label,
      electricity: pick(["ELECTRICITY"]),
      water: pick(["WATER"]),
      gas: pick(["GAS"]),
      internet: pick(["INTERNET"]),
    };
  });

  const bazaarTotal = await db.bazaarEntry.aggregate({
    where: { messId, date: { gte: start, lte: end }, deletedAt: null },
    _sum: { totalAmount: true },
  });

  const overview = {
    totalMembers: summary.memberCount,
    activeMembers: summary.memberCount,
    totalMeals: summary.totalMeals,
    totalDeposits: summary.totalDeposits,
    totalExpenses: summary.totalExpenses,
    mealRate: summary.mealRate,
    totalDue: summary.totalDue,
    currentBalance: summary.billKpis.messBalance,
    bazaarCost: bazaarTotal._sum.totalAmount ?? 0,
  };

  return {
    range,
    overview,
    expenseTrend,
    depositTrend,
    expenseBreakdown,
    mealByMonth,
    depositRanking,
    dueRanking,
    utilityTrend,
    budgetVsActual: months.map((m, i) => ({
      month: m.label,
      budget: summary.totalExpenses / 6,
      actual: expenseTrend[i]?.amount ?? 0,
    })),
    insights: buildMessInsights(summary, expenseTrend),
  };
}

function buildMessInsights(
  summary: NonNullable<Awaited<ReturnType<typeof getMonthSummary>>>,
  expenseTrend: { month: string; amount: number }[]
) {
  const insights: string[] = [];
  const dueCount = summary.members.filter((m) => m.due > 0).length;
  if (dueCount > 0) insights.push(`${dueCount} members currently have overdue balances.`);
  if (expenseTrend.length >= 2) {
    const last = expenseTrend[expenseTrend.length - 1].amount;
    const prev = expenseTrend[expenseTrend.length - 2].amount;
    if (prev > 0) {
      const pct = Math.round(((last - prev) / prev) * 100);
      insights.push(
        pct >= 0
          ? `Expenses increased by ${pct}% compared to last month.`
          : `Expenses decreased by ${Math.abs(pct)}% compared to last month.`
      );
    }
  }
  const topCat = Object.entries(summary.billsByCategory).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push(
      `${getBillCategoryLabel(topCat[0] as BillCategoryType)} is the highest expense category.`
    );
  }
  if (summary.totalDeposits < summary.totalExpenses) {
    insights.push("Deposits are lower than expenses this month.");
  }
  return insights;
}

export async function getMemberAnalytics(messId: string) {
  const { user, member } = await requireMessAccess(messId);
  if (!member) throw new Error("Not a member");

  const mess = await db.mess.findFirst({
    where: { id: messId },
    include: { currentMonth: true },
  });
  if (!mess?.currentMonthId) throw new Error("No active month");

  const summary = await getMonthSummary(messId, mess.currentMonthId);
  const myStats = summary?.members.find((m) => m.id === member.id);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { label: format(d, "MMM"), start: startOfMonth(d), end: endOfMonth(d) };
  });

  const mealTrend = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const entries = await db.mealEntry.findMany({
        where: { memberId: member.id, meal: { date: { gte: start, lte: end } } },
      });
      const total = entries.reduce((s, e) => s + e.breakfast + e.lunch + e.dinner, 0);
      return { month: label, meals: total };
    })
  );

  const depositTrend = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const r = await db.deposit.aggregate({
        where: {
          memberId: member.id,
          status: "APPROVED",
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { amount: true },
      });
      return { month: label, amount: r._sum.amount ?? 0 };
    })
  );

  const costTrend = mealTrend.map((m) => ({
    month: m.month,
    cost:
      ((myStats?.mealCost ?? 0) / Math.max(myStats?.mealCount ?? 1, 1)) *
      m.meals,
  }));

  return {
    overview: {
      myMeals: myStats?.mealCount ?? 0,
      myDeposits: myStats?.totalDeposit ?? 0,
      myExpenses: myStats?.totalCost ?? 0,
      myDue: myStats?.due ?? 0,
      myBalance: myStats?.balance ?? 0,
      userName: user.name ?? user.email,
    },
    mealTrend,
    depositTrend,
    costTrend,
    balanceTrend: depositTrend.map((d, i) => ({
      month: d.month,
      balance: d.amount - (costTrend[i]?.cost ?? 0),
    })),
    insights: [
      myStats && myStats.due > 0
        ? `You have ৳${myStats.due.toFixed(0)} due this month.`
        : "Your account is clear this month.",
      `You logged ${myStats?.mealCount ?? 0} meals in the current period.`,
    ],
  };
}

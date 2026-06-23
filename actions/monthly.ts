"use server";

import { revalidatePath } from "next/cache";
import type { BillCategoryType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireMessAccess } from "@/lib/mess-access";
import { assertMessWriteAccess } from "@/lib/billing/subscription-access";
import {
  calculateMealRate,
  calculateMemberFinancials,
  countMeals,
  formatMonthLabel,
  getCurrentYearMonth,
} from "@/lib/calculations";
import {
  addToBillBreakdown,
  emptyBillBreakdown,
  isRentCategory,
  isUtilityCategory,
  type BillShareBreakdown,
} from "@/lib/bills/categories";
import { canUseFeature, FEATURES } from "@/lib/features";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function isMealExpense(category: { name: string; isMealCost: boolean }): boolean {
  if (category.isMealCost) return true;
  const n = category.name.toLowerCase();
  return n === "grocery" || n === "bazaar" || n.includes("meal");
}

export async function getMonthSummary(messId: string, monthId: string) {
  await requireMessAccess(messId, "MESS_READ");
  const month = await db.messMonth.findFirst({
    where: { id: monthId, messId, deletedAt: null },
  });
  if (!month) return null;

  const [members, expenses, deposits, mealEntries, bills] = await Promise.all([
    db.member.findMany({
      where: { messId, deletedAt: null, status: "ACTIVE" },
      include: { user: { select: { email: true, image: true } } },
    }),
    db.expense.findMany({
      where: { messId, monthId, deletedAt: null, status: "APPROVED" },
      include: { category: true },
    }),
    db.deposit.findMany({
      where: { messId, monthId, deletedAt: null, status: "APPROVED" },
    }),
    db.mealEntry.findMany({
      where: { messId, meal: { monthId } },
      select: { memberId: true, breakfast: true, lunch: true, dinner: true },
    }),
    db.bill.findMany({
      where: { messId, monthId, deletedAt: null },
      include: { memberShares: true },
    }),
  ]);

  const mealExpenses = expenses.filter((e) => isMealExpense(e.category));
  const totalMealExpenses = mealExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDeposits = deposits.reduce((s, d) => s + d.amount, 0);
  const totalMeals = mealEntries.reduce((s, e) => s + countMeals(e), 0);
  const mealRate = calculateMealRate(totalMealExpenses, totalMeals);

  const totalSharedBills = bills.reduce((s, b) => s + b.amount, 0);
  let totalRent = 0;
  let totalUtilities = 0;
  for (const b of bills) {
    if (isRentCategory(b.category)) totalRent += b.amount;
    else if (isUtilityCategory(b.category)) totalUtilities += b.amount;
  }

  const memberBillMap = new Map<string, BillShareBreakdown>();
  for (const m of members) {
    memberBillMap.set(m.id, emptyBillBreakdown());
  }

  for (const bill of bills) {
    for (const share of bill.memberShares) {
      const current = memberBillMap.get(share.memberId) ?? emptyBillBreakdown();
      memberBillMap.set(share.memberId, addToBillBreakdown(current, bill.category, share.amount));
    }
  }

  const memberStats = members.map((m) => {
    const meals = mealEntries
      .filter((e) => e.memberId === m.id)
      .reduce((s, e) => s + countMeals(e), 0);
    const memberDeposits = deposits
      .filter((d) => d.memberId === m.id)
      .reduce((s, d) => s + d.amount, 0);
    const billShares = memberBillMap.get(m.id) ?? emptyBillBreakdown();

    return {
      ...m,
      ...calculateMemberFinancials({
        memberId: m.id,
        mealCount: meals,
        mealRate,
        totalDeposit: memberDeposits,
        billShares,
      }),
    };
  });

  const totalDue = memberStats.reduce((s, m) => s + m.due, 0);
  const totalMealCost = totalMeals * mealRate;

  const billsByCategory = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.amount;
    return acc;
  }, {});

  return {
    month: { ...month, sharedCost: totalSharedBills },
    totalExpenses,
    totalMealExpenses,
    totalDeposits,
    totalMeals,
    mealRate,
    totalDue,
    memberCount: members.length,
    members: memberStats,
    bills,
    billKpis: {
      totalRent,
      totalUtilities,
      totalSharedBills,
      totalMealCost,
      totalDeposits,
      totalDue,
      messBalance: totalDeposits - totalMealExpenses - totalSharedBills,
    },
    billsByCategory: billsByCategory as Partial<Record<BillCategoryType, number>>,
  };
}

export async function recalculateMonth(messId: string, monthId: string) {
  await requireMessAccess(messId, "MESS_READ");
  const summary = await getMonthSummary(messId, monthId);
  if (!summary) return;

  await db.messMonth.update({
    where: { id: monthId },
    data: {
      totalMeals: summary.totalMeals,
      totalExpenses: summary.totalExpenses,
      totalDeposits: summary.totalDeposits,
      mealRate: summary.mealRate,
      sharedCost: summary.billKpis.totalSharedBills,
    },
  });

  for (const m of summary.members) {
    await db.member.update({
      where: { id: m.id },
      data: {
        totalMeals: m.mealCount,
        totalDue: m.due,
        totalDeposit: m.totalDeposit,
        advanceBalance: m.advance,
      },
    });
  }

  await db.mess.update({
    where: { id: messId },
    data: {
      totalMeals: summary.totalMeals,
      totalExpenses: summary.totalExpenses,
      mealRate: summary.mealRate,
    },
  });
}

export async function getNewMonthPreview(messId: string) {
  await requireMessAccess(messId, "MESS_UPDATE");

  const mess = await db.mess.findUnique({
    where: { id: messId },
    include: { currentMonth: true },
  });
  if (!mess?.currentMonth) return null;

  let nextYear = mess.currentMonth.year;
  let nextMonth = mess.currentMonth.month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  return {
    currentMonthId: mess.currentMonth.id,
    currentLabel: mess.currentMonth.label,
    suggestedLabel: formatMonthLabel(nextYear, nextMonth),
    nextYear,
    nextMonth,
  };
}

export async function startNewMonth(
  messId: string,
  label?: string
): Promise<ActionResult<{ monthId: string }>> {
  try {
    await requireMessAccess(messId, "MESS_UPDATE");
    await assertMessWriteAccess(messId);

    const mess = await db.mess.findUnique({
      where: { id: messId },
      include: { currentMonth: true, subscription: { include: { plan: true } } },
    });
    if (!mess?.currentMonth) return { success: false, error: "No active month found" };

    const summary = await getMonthSummary(messId, mess.currentMonth.id);
    if (!summary) return { success: false, error: "Could not compute month summary" };

    await db.messMonth.update({
      where: { id: mess.currentMonth.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        totalMeals: summary.totalMeals,
        totalExpenses: summary.totalExpenses,
        totalDeposits: summary.totalDeposits,
        mealRate: summary.mealRate,
        sharedCost: summary.billKpis.totalSharedBills,
        snapshot: JSON.stringify(
          summary.members.map((m) => ({
            memberId: m.id,
            fullName: m.fullName,
            mealCount: m.mealCount,
            mealCost: m.mealCost,
            billShares: m.billShares,
            totalBillShare: m.totalBillShare,
            totalCost: m.totalCost,
            totalDeposit: m.totalDeposit,
            due: m.due,
            advance: m.advance,
            balance: m.balance,
          }))
        ),
      },
    });

    await db.report.create({
      data: {
        messId,
        type: "MONTHLY",
        title: `${mess.currentMonth.label} Settlement`,
        data: JSON.stringify(summary),
        periodStart: mess.currentMonth.startedAt,
        periodEnd: new Date(),
      },
    });

    let nextYear = mess.currentMonth.year;
    let nextMonth = mess.currentMonth.month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const monthLabel = label?.trim() || formatMonthLabel(nextYear, nextMonth);
    if (monthLabel.length < 2) {
      return { success: false, error: "Month name must be at least 2 characters" };
    }
    if (monthLabel.length > 100) {
      return { success: false, error: "Month name is too long" };
    }

    const newMonth = await db.messMonth.create({
      data: {
        messId,
        year: nextYear,
        month: nextMonth,
        label: monthLabel,
        status: "ACTIVE",
      },
    });

    await db.mess.update({
      where: { id: messId },
      data: { currentMonthId: newMonth.id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/months`);
    return { success: true, data: { monthId: newMonth.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to start new month" };
  }
}

export async function getAllMonths(messId: string) {
  await requireMessAccess(messId, "MESS_READ");
  return db.messMonth.findMany({
    where: { messId, deletedAt: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function generateMonthPdf(messId: string, monthId: string): Promise<ActionResult<{ url: string }>> {
  try {
    const { mess } = await requireMessAccess(messId, "REPORT_EXPORT");
    const plan = mess.subscription?.plan;
    if (!canUseFeature(plan, FEATURES.PDF_REPORTS)) {
      return { success: false, error: "PDF export requires Pro plan or higher" };
    }

    const summary = await getMonthSummary(messId, monthId);
    if (!summary) return { success: false, error: "Month not found" };

    return { success: true, data: { url: `/api/reports/pdf?messId=${messId}&monthId=${monthId}` } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "PDF generation failed" };
  }
}

export async function settleMonth(messId: string, monthId: string): Promise<ActionResult> {
  try {
    await requireMessAccess(messId, "MESS_UPDATE");
    await assertMessWriteAccess(messId);
    await recalculateMonth(messId, monthId);

    const summary = await getMonthSummary(messId, monthId);
    if (!summary) return { success: false, error: "Month not found" };

    await db.messMonth.update({
      where: { id: monthId },
      data: {
        snapshot: JSON.stringify(summary.members),
        totalMeals: summary.totalMeals,
        totalExpenses: summary.totalExpenses,
        totalDeposits: summary.totalDeposits,
        mealRate: summary.mealRate,
        sharedCost: summary.billKpis.totalSharedBills,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Settlement failed" };
  }
}

export async function createInitialMonth(messId: string) {
  await requireMessAccess(messId, "MESS_UPDATE");
  const { year, month } = getCurrentYearMonth();
  const existing = await db.messMonth.findUnique({
    where: { messId_year_month: { messId, year, month } },
  });
  if (existing) {
    await db.mess.update({ where: { id: messId }, data: { currentMonthId: existing.id } });
    return existing;
  }

  const monthRecord = await db.messMonth.create({
    data: {
      messId,
      year,
      month,
      label: formatMonthLabel(year, month),
      status: "ACTIVE",
    },
  });

  await db.mess.update({
    where: { id: messId },
    data: { currentMonthId: monthRecord.id },
  });

  return monthRecord;
}

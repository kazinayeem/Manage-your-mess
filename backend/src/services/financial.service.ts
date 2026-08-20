import { prisma } from "../config/database";
import {
  emptyBillBreakdown,
  addToBillBreakdown,
  isRentCategory,
  isUtilityCategory,
  type BillCategoryType,
  type BillShareBreakdown,
} from "../utils/bills/categories";

export interface MemberFinancials {
  memberId: string;
  mealCount: number;
  mealCost: number;
  totalDeposit: number;
  balance: number;
  due: number;
  advance: number;
  sharedCostShare: number;
  individualCost: number;
  billShares: BillShareBreakdown;
  totalBillShare: number;
  totalCost: number;
}

export function countMeals(entry: {
  breakfast: number | boolean;
  lunch: number | boolean;
  dinner: number | boolean;
}): number {
  const portion = (v: number | boolean) =>
    typeof v === "boolean" ? (v ? 1 : 0) : Number(v) || 0;
  return portion(entry.breakfast) + portion(entry.lunch) + portion(entry.dinner);
}

export function calculateMealRate(totalMealExpenses: number, totalMeals: number): number {
  if (totalMeals <= 0) return 0;
  return totalMealExpenses / totalMeals;
}

export function calculateMealCost(mealCount: number, mealRate: number): number {
  return mealCount * mealRate;
}

export function calculateBalance(
  totalDeposit: number,
  mealCost: number,
  billShare = 0
): number {
  return totalDeposit - mealCost - billShare;
}

export function calculateDue(balance: number): number {
  return Math.max(0, -balance);
}

export function calculateAdvance(balance: number): number {
  return Math.max(0, balance);
}

export function isMealExpense(category: { name: string; isMealCost: boolean }): boolean {
  if (category.isMealCost) return true;
  const n = category.name.toLowerCase();
  return n === "grocery" || n === "bazaar" || n.includes("meal");
}

export async function calculateMonthSummary(messId: string, monthId: string) {
  const month = await prisma.messMonth.findFirst({
    where: { id: monthId, messId, deletedAt: null },
  });
  if (!month) return null;

  const [members, expenses, deposits, mealEntries, bills] = await Promise.all([
    prisma.member.findMany({
      where: { messId, deletedAt: null, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, email: true, image: true, phone: true } } },
    }),
    prisma.expense.findMany({
      where: { messId, monthId, deletedAt: null, status: "APPROVED" },
      include: { category: true },
    }),
    prisma.deposit.findMany({
      where: { messId, monthId, deletedAt: null, status: "APPROVED" },
    }),
    prisma.mealEntry.findMany({
      where: { messId, meal: { monthId } },
      select: { memberId: true, breakfast: true, lunch: true, dinner: true },
    }),
    prisma.bill.findMany({
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
    const mealCost = calculateMealCost(meals, mealRate);
    const totalBillShare = billShares.total;
    const totalCost = mealCost + totalBillShare;
    const balance = calculateBalance(memberDeposits, mealCost, totalBillShare);

    return {
      ...m,
      mealCount: meals,
      mealCost,
      totalDeposit: memberDeposits,
      balance,
      due: calculateDue(balance),
      advance: calculateAdvance(balance),
      sharedCostShare: totalBillShare,
      individualCost: totalCost,
      billShares,
      totalBillShare,
      totalCost,
    };
  });

  const totalDue = memberStats.reduce((s, m) => s + m.due, 0);
  const totalMealCost = totalMeals * mealRate;
  const messBalance = totalDeposits - totalExpenses - totalSharedBills;

  const billsByCategory = bills.reduce((acc: Record<string, number>, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.amount;
    return acc;
  }, {} as Record<string, number>);

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
      messBalance,
    },
    billsByCategory: billsByCategory as Partial<Record<BillCategoryType, number>>,
  };
}

export async function recalculateMonth(messId: string, monthId: string) {
  const summary = await calculateMonthSummary(messId, monthId);
  if (!summary) return null;

  await prisma.messMonth.update({
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
    await prisma.member.update({
      where: { id: m.id },
      data: {
        totalMeals: m.mealCount,
        totalDue: m.due,
        totalDeposit: m.totalDeposit,
        advanceBalance: m.advance,
      },
    });
  }

  await prisma.mess.update({
    where: { id: messId },
    data: {
      totalMeals: summary.totalMeals,
      totalExpenses: summary.totalExpenses,
      mealRate: summary.mealRate,
    },
  });

  return summary;
}

export async function logFinancialTransaction(data: {
  messId: string;
  monthId?: string | null;
  type:
    | "DEPOSIT"
    | "BAZAAR_COST"
    | "BAZAAR_PERSONAL_CREDIT"
    | "EXPENSE"
    | "BILL_SHARE"
    | "REFUND"
    | "ADJUSTMENT"
    | "SETTLEMENT";
  amount: number;
  memberId?: string | null;
  createdById: string;
  referenceId?: string | null;
  referenceType?: string | null;
  description?: string | null;
}) {
  return prisma.financialTransaction.create({
    data: {
      messId: data.messId,
      monthId: data.monthId ?? null,
      type: data.type,
      amount: data.amount,
      memberId: data.memberId ?? null,
      createdById: data.createdById,
      referenceId: data.referenceId ?? null,
      referenceType: data.referenceType ?? null,
      description: data.description ?? null,
    },
  });
}

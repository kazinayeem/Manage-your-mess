import type { BillShareBreakdown } from "../constants/bill-categories";
import { emptyBillBreakdown } from "../constants/bill-categories";

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

export function mealPortionToNumber(value: string | number): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (n === 0.5) return 0.5;
  if (n >= 1) return 1;
  return 0;
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

export function formatMealPortion(value: number): string {
  if (value === 0) return "—";
  if (value === 0.5) return "½";
  return "1";
}

export function calculateMealRate(totalMealExpenses: number, totalMeals: number): number {
  if (totalMeals <= 0) return 0;
  return totalMealExpenses / totalMeals;
}

export function calculateMealCost(mealCount: number, mealRate: number): number {
  return mealCount * mealRate;
}

export function calculateSharedCostPerMember(sharedCost: number, memberCount: number): number {
  if (memberCount <= 0) return 0;
  return sharedCost / memberCount;
}

export function calculateBalance(totalDeposit: number, mealCost: number, billShare = 0): number {
  return totalDeposit - mealCost - billShare;
}

export function calculateDue(balance: number): number {
  return Math.max(0, -balance);
}

export function calculateAdvance(balance: number): number {
  return Math.max(0, balance);
}

export function calculateMemberFinancials(input: {
  memberId: string;
  mealCount: number;
  mealRate: number;
  totalDeposit: number;
  billShares?: BillShareBreakdown;
}): MemberFinancials {
  const mealCost = calculateMealCost(input.mealCount, input.mealRate);
  const billShares = input.billShares ?? emptyBillBreakdown();
  const totalBillShare = billShares.total;
  const totalCost = mealCost + totalBillShare;
  const balance = calculateBalance(input.totalDeposit, mealCost, totalBillShare);

  return {
    memberId: input.memberId,
    mealCount: input.mealCount,
    mealCost,
    totalDeposit: input.totalDeposit,
    balance,
    due: calculateDue(balance),
    advance: calculateAdvance(balance),
    sharedCostShare: totalBillShare,
    individualCost: totalCost,
    billShares,
    totalBillShare,
    totalCost,
  };
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatBdt(amount: number): string {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });
  return `৳${formatted}`;
}
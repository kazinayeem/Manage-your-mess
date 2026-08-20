import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess } from "../utils/response";
import { countMeals, formatMealPortion, calculateMealRate, calculateMemberFinancials } from "../utils/calculations";
import { getBillCategoryLabel, isRentCategory, isUtilityCategory, emptyBillBreakdown, addToBillBreakdown } from "../utils/bills/categories";

function formatBdt(amount: number): string {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  return `৳${amount.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })}`;
}

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function monthDateRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function makeSection(
  key: string,
  title: string,
  columns: any[],
  rows: any[],
  emptyMessage?: string
) {
  return { key, title, columns, rows, emptyMessage };
}

export async function getMessMonthsForReports(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const months = await prisma.messMonth.findMany({
    where: { messId, deletedAt: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { id: true, label: true, year: true, month: true, status: true },
  });

  return sendSuccess(res, months);
}

export async function fetchReportData(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || (req.query.messId as string);
  const monthId = req.query.monthId as string;
  const reportType = (req.query.reportType as string) || "monthly";
  const locale = req.query.locale === "bn" ? "bn" : "en";

  if (!messId || !monthId) throw new ValidationError("Mess ID and Month ID required");

  const mess = await prisma.mess.findUnique({ where: { id: messId } });
  if (!mess) throw new NotFoundError("Mess not found");

  const month = await prisma.messMonth.findFirst({
    where: { id: monthId, messId, deletedAt: null },
  });
  if (!month) throw new NotFoundError("Month not found");

  // Load Month Summary Data
  const [members, expenses, deposits, mealEntries, bills] = await Promise.all([
    prisma.member.findMany({
      where: { messId, deletedAt: null, status: "ACTIVE" },
      include: { user: { select: { email: true, image: true } } },
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

  const mealExpenses = expenses.filter((e) => e.category.isMealCost || ["grocery", "bazaar"].includes(e.category.name.toLowerCase()));
  const totalMealExpenses = mealExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDeposits = deposits.reduce((s, d) => s + d.amount, 0);
  const totalMeals = mealEntries.reduce((s, e) => s + countMeals(e), 0);
  const mealRate = calculateMealRate(totalMealExpenses, totalMeals);

  const totalSharedBills = bills.reduce((s, b) => s + b.amount, 0);
  let totalRent = 0;
  let totalUtilities = 0;
  for (const b of bills) {
    if (isRentCategory(b.category as any)) totalRent += b.amount;
    else if (isUtilityCategory(b.category as any)) totalUtilities += b.amount;
  }

  const memberBillMap = new Map<string, any>();
  for (const m of members) memberBillMap.set(m.id, emptyBillBreakdown());

  for (const bill of bills) {
    for (const share of bill.memberShares) {
      const current = memberBillMap.get(share.memberId) ?? emptyBillBreakdown();
      memberBillMap.set(share.memberId, addToBillBreakdown(current, bill.category as any, share.amount));
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
  const messBalance = totalDeposits - totalMealExpenses - totalSharedBills;

  const billsByCategory = bills.reduce((acc: Record<string, number>, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.amount;
    return acc;
  }, {});

  const summary = {
    month,
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
      totalMealCost: totalMeals * mealRate,
      totalDeposits,
      totalDue,
      messBalance,
    },
    billsByCategory,
  };

  const generatedAt = new Date().toISOString();

  const baseMeta = {
    messName: mess.name,
    messAddress: mess.address,
    reportType,
    monthLabel: month.label,
    generatedAt,
    generatedBy: req.user.name || req.user.email,
    reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
    currency: "BDT",
    dateRangeLabel: month.label,
  };

  if (reportType === "monthly" || reportType === "balance_sheet") {
    const title = reportType === "balance_sheet" ? "Balance Report" : "Monthly Settlement Report";
    const membersWithDue = memberStats.filter((m) => m.due > 0).length;

    const summaryRows = [
      { label: "Total Members", value: String(summary.memberCount) },
      { label: "Total Meals", value: String(summary.totalMeals) },
      { label: "Meal Rate", value: formatBdt(summary.mealRate) },
      { label: "Total Deposits", value: formatBdt(summary.totalDeposits) },
      { label: "Total Expenses", value: formatBdt(summary.totalExpenses) },
      { label: "Total Shared Cost", value: formatBdt(summary.billKpis.totalSharedBills) },
      { label: "Total Due", value: formatBdt(summary.totalDue) },
      { label: "Closing Balance", value: formatBdt(summary.billKpis.messBalance) },
    ];

    return sendSuccess(res, {
      meta: { ...baseMeta, reportTitle: title, periodLabel: month.label },
      summary: summaryRows,
      columns: [
        { key: "name", label: "Member", align: "left" },
        { key: "mealCount", label: "Meals", format: "number", align: "right" },
        { key: "deposit", label: "Deposit", format: "currency", align: "right" },
        { key: "mealCost", label: "Meal Cost", format: "currency", align: "right" },
        { key: "billShare", label: "Bill Share", format: "currency", align: "right" },
        { key: "totalCost", label: "Total Cost", format: "currency", align: "right" },
        { key: "balance", label: "Balance", format: "currency", align: "right", allowNegative: true },
        { key: "status", label: "Status", align: "left" },
      ],
      rows: memberStats.map((m) => ({
        name: m.fullName ?? "Unnamed",
        mealCount: m.mealCount,
        deposit: m.totalDeposit,
        mealCost: m.mealCost,
        billShare: m.totalBillShare,
        totalCost: m.totalCost,
        balance: m.advance > 0 ? m.advance : -m.due,
        status: m.due > 0 ? "Due" : m.advance > 0 ? "Advance" : "Clear",
      })),
      sections: [
        makeSection(
          "memberDetails",
          locale === "bn" ? "সদস্য বিস্তারিত" : "Member Breakdown",
          [
            { key: "name", label: "Member", align: "left" },
            { key: "mealCount", label: "Meals", format: "number", align: "right" },
            { key: "deposit", label: "Deposit", format: "currency", align: "right" },
            { key: "due", label: "Due", format: "currency", align: "right" },
            { key: "balance", label: "Balance", format: "currency", align: "right" },
          ],
          memberStats.map((m) => ({
            name: m.fullName ?? "Unnamed",
            mealCount: m.mealCount,
            deposit: m.totalDeposit,
            due: m.due,
            balance: m.advance > 0 ? m.advance : -m.due,
          }))
        ),
      ],
      analytics: {
        dueStats: {
          membersWithDue,
          totalDue: summary.totalDue,
        },
      },
    });
  }

  // Fallback default response for other report types
  return sendSuccess(res, {
    meta: { ...baseMeta, reportTitle: `${reportType} Report`, periodLabel: month.label },
    summary: [
      { label: "Members", value: String(summary.memberCount) },
      { label: "Meals", value: String(summary.totalMeals) },
      { label: "Expenses", value: formatBdt(summary.totalExpenses) },
    ],
    columns: [
      { key: "name", label: "Member", align: "left" },
      { key: "deposit", label: "Deposit", format: "currency", align: "right" },
      { key: "due", label: "Due", format: "currency", align: "right" },
    ],
    rows: memberStats.map((m) => ({
      name: m.fullName ?? "Unnamed",
      deposit: m.totalDeposit,
      due: m.due,
    })),
  });
}

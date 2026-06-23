"use server";

import { db } from "@/lib/db";
import { requireMessAccess } from "@/lib/mess-access";
import { getMonthSummary } from "@/actions/monthly";
import { countMeals, formatMealPortion } from "@/lib/calculations";
import type {
  ReportPayload,
  ReportType,
  MonthOption,
  ReportFetchOptions,
  ReportSection,
} from "@/lib/reports/types";
import { getBillCategoryLabel } from "@/lib/bills/categories";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

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

function emptyStateFor(locale: "en" | "bn", reportTitle: string) {
  return locale === "bn"
    ? {
        title: `${reportTitle} এর জন্য কোনো ডেটা নেই`,
        description: "নির্বাচিত সময়সীমায় প্রদর্শনের মতো কোনো রেকর্ড পাওয়া যায়নি।",
      }
    : {
        title: `No data available for ${reportTitle}`,
        description: "No records were found for the selected reporting period.",
      };
}

function makeSection(
  key: string,
  title: string,
  columns: ReportSection["columns"],
  rows: ReportSection["rows"],
  emptyMessage?: string
): ReportSection {
  return { key, title, columns, rows, emptyMessage };
}

export async function getMessMonthsForReports(messId: string): Promise<MonthOption[]> {
  await requireMessAccess(messId, "REPORT_VIEW");
  const months = await db.messMonth.findMany({
    where: { messId, deletedAt: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { id: true, label: true, year: true, month: true, status: true },
  });
  return months;
}

export async function fetchReportData(
  messId: string,
  monthId: string,
  reportType: ReportType,
  options?: ReportFetchOptions
): Promise<ActionResult<ReportPayload>> {
  try {
    const { mess, user } = await requireMessAccess(messId, "REPORT_VIEW");
    const locale = options?.locale === "bn" ? "bn" : "en";

    const month = await db.messMonth.findFirst({
      where: { id: monthId, messId, deletedAt: null },
    });
    if (!month) return { success: false, error: "Month not found" };

    const summary = await getMonthSummary(messId, monthId);
    if (!summary) return { success: false, error: "Could not load month data" };

    const generatedAt = new Date().toISOString();
    const { start: monthStart, end: monthEnd } = monthDateRange(month.year, month.month);

    const baseMeta = {
      messName: mess.name,
      messAddress: mess.address,
      reportType,
      monthLabel: month.label,
      generatedAt,
      generatedBy: options?.generatedBy ?? user.name ?? user.email,
      reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      currency: options?.currency ?? "BDT",
      dateRangeLabel: options?.dateRangeStart
        ? `${options.dateRangeStart} – ${options.dateRangeEnd ?? formatDateStr(new Date())}`
        : month.label,
    };

    if (reportType === "monthly" || reportType === "balance_sheet") {
      const title =
        reportType === "balance_sheet" ? "Balance Report" : "Monthly Settlement Report";
      const membersWithDue = summary.members.filter((m) => m.due > 0).length;

      const [monthExpenses, bazaarTasks] = await Promise.all([
        db.expense.findMany({
          where: { messId, monthId, deletedAt: null, status: "APPROVED" },
          include: { category: { select: { name: true } } },
          orderBy: { date: "asc" },
        }),
        db.bazaarTask.findMany({
          where: {
            messId,
            deletedAt: null,
            shoppingDate: { gte: monthStart, lte: monthEnd },
          },
          include: {
            assignment: { include: { member: { select: { fullName: true } } } },
            items: { select: { name: true } },
            submission: true,
          },
          orderBy: { shoppingDate: "asc" },
        }),
      ]);

      const expenseBreakdown = Object.entries(summary.billsByCategory).map(([cat, amt]) => ({
        label: getBillCategoryLabel(cat as Parameters<typeof getBillCategoryLabel>[0]),
        amount: amt,
      }));

      const cat = summary.billsByCategory;
      const otherSharedBills =
        summary.billKpis.totalSharedBills -
        summary.billKpis.totalRent -
        (cat.ELECTRICITY ?? 0) -
        (cat.WATER ?? 0) -
        (cat.GAS ?? 0) -
        (cat.INTERNET ?? 0);

      const summaryRows: { label: string; value: string }[] = [
        { label: "Total Members", value: String(summary.memberCount) },
        { label: "Total Meals", value: String(summary.totalMeals) },
        { label: "Meal Rate", value: formatBdt(summary.mealRate) },
        { label: "Total Deposits", value: formatBdt(summary.totalDeposits) },
        { label: "Total Expenses", value: formatBdt(summary.totalExpenses) },
        { label: "Total Rent", value: formatBdt(summary.billKpis.totalRent) },
        { label: "Electricity", value: formatBdt(cat.ELECTRICITY ?? 0) },
        { label: "Water", value: formatBdt(cat.WATER ?? 0) },
        { label: "Gas", value: formatBdt(cat.GAS ?? 0) },
        { label: "Internet", value: formatBdt(cat.INTERNET ?? 0) },
        { label: "Total Utility Bills", value: formatBdt(summary.billKpis.totalUtilities) },
        { label: "Total Shared Cost", value: formatBdt(summary.billKpis.totalSharedBills) },
        { label: "Other Expenses", value: formatBdt(otherSharedBills) },
        { label: "Total Due", value: formatBdt(summary.totalDue) },
        { label: "Closing Balance", value: formatBdt(summary.billKpis.messBalance) },
      ];

      const mealEntries = await db.mealEntry.findMany({
        where: { messId, meal: { monthId } },
        select: { breakfast: true, lunch: true, dinner: true },
      });
      const mealBreakdown = mealEntries.reduce(
        (acc, e) => ({
          breakfast: acc.breakfast + e.breakfast,
          lunch: acc.lunch + e.lunch,
          dinner: acc.dinner + e.dinner,
        }),
        { breakfast: 0, lunch: 0, dinner: 0 }
      );

      return {
        success: true,
        data: {
          meta: {
            ...baseMeta,
            reportTitle: title,
            periodLabel: month.label,
          },
          summary: summaryRows,
          columns: [
            { key: "name", label: "Member", align: "left" },
            { key: "mealCount", label: "Meals", format: "number", align: "right" },
            { key: "deposit", label: "Deposit", format: "currency", align: "right" },
            { key: "mealCost", label: "Meal Cost", format: "currency", align: "right" },
            { key: "billShare", label: "Bill Share", format: "currency", align: "right" },
            { key: "otherCost", label: "Other Cost", format: "currency", align: "right" },
            { key: "totalCost", label: "Total Cost", format: "currency", align: "right" },
            { key: "balance", label: "Balance", format: "currency", align: "right", allowNegative: true },
            { key: "status", label: "Status", align: "left" },
          ],
          rows: summary.members.map((m) => ({
            name: m.fullName ?? "Unnamed",
            mealCount: m.mealCount,
            deposit: m.totalDeposit,
            mealCost: m.mealCost,
            billShare: m.totalBillShare,
            otherCost: m.billShares.maintenance + m.billShares.other,
            totalCost: m.totalCost,
            balance: m.advance > 0 ? m.advance : -m.due,
            status: m.due > 0 ? "Due" : m.advance > 0 ? "Advance" : "Clear",
          })),
          sections: [
            makeSection(
              "memberDetails",
              locale === "bn" ? "সদস্য বিস্তারিত" : "Member Details",
              [
                { key: "name", label: "Member", align: "left" },
                { key: "mealCount", label: "Meals", format: "number", align: "right" },
                { key: "deposit", label: "Deposit", format: "currency", align: "right" },
                { key: "mealCost", label: "Meal Cost", format: "currency", align: "right" },
                { key: "billShare", label: "Bill Share", format: "currency", align: "right" },
                { key: "otherCost", label: "Other Cost", format: "currency", align: "right" },
                { key: "totalCost", label: "Total Cost", format: "currency", align: "right" },
                { key: "balance", label: "Balance", format: "currency", align: "right", allowNegative: true },
                { key: "status", label: "Status", align: "left" },
              ],
              summary.members.map((m) => ({
                name: m.fullName ?? "Unnamed",
                mealCount: m.mealCount,
                deposit: m.totalDeposit,
                mealCost: m.mealCost,
                billShare: m.totalBillShare,
                otherCost: m.billShares.maintenance + m.billShares.other,
                totalCost: m.totalCost,
                balance: m.advance > 0 ? m.advance : -m.due,
                status: m.due > 0 ? "Due" : m.advance > 0 ? "Advance" : "Clear",
              }))
            ),
            makeSection(
              "utilityBills",
              locale === "bn" ? "ইউটিলিটি বিল" : "Utility Bills",
              [
                { key: "category", label: "Category", align: "left" },
                { key: "amount", label: "Amount", format: "currency", align: "right" },
              ],
              [
                { category: locale === "bn" ? "ভাড়া" : "Rent", amount: summary.billKpis.totalRent },
                { category: locale === "bn" ? "বিদ্যুৎ" : "Electricity", amount: cat.ELECTRICITY ?? 0 },
                { category: locale === "bn" ? "পানি" : "Water", amount: cat.WATER ?? 0 },
                { category: locale === "bn" ? "গ্যাস" : "Gas", amount: cat.GAS ?? 0 },
                { category: locale === "bn" ? "ইন্টারনেট" : "Internet", amount: cat.INTERNET ?? 0 },
                { category: locale === "bn" ? "রক্ষণাবেক্ষণ" : "Maintenance", amount: cat.MAINTENANCE ?? 0 },
                { category: locale === "bn" ? "নিরাপত্তা" : "Security", amount: cat.SECURITY_GUARD ?? 0 },
                { category: locale === "bn" ? "অন্যান্য" : "Other", amount: otherSharedBills },
                {
                  category: locale === "bn" ? "মোট" : "Total",
                  amount:
                    summary.billKpis.totalUtilities +
                    summary.billKpis.totalRent +
                    Math.max(otherSharedBills, 0),
                },
              ]
            ),
            makeSection(
              "bazaar",
              locale === "bn" ? "বাজার" : "Bazaar",
              [
                { key: "date", label: "Date", align: "left" },
                { key: "member", label: "Member", align: "left" },
                { key: "items", label: "Description", align: "left" },
                { key: "amount", label: "Amount", format: "currency", align: "right" },
                { key: "status", label: "Status", align: "left" },
              ],
              bazaarTasks.map((task) => ({
                date: formatDateStr(task.shoppingDate),
                member: task.assignment?.member.fullName ?? "—",
                items: task.items.map((item) => item.name).join(", ") || "—",
                amount: task.submission?.actualCost ?? task.expectedBudget,
                status: task.status,
              })),
              locale === "bn" ? "এই মাসে কোনো বাজার রেকর্ড নেই।" : "No bazaar records were found for this month."
            ),
            makeSection(
              "expenses",
              locale === "bn" ? "খরচ" : "Expenses",
              [
                { key: "date", label: "Date", align: "left" },
                { key: "category", label: "Category", align: "left" },
                { key: "description", label: "Description", align: "left" },
                { key: "amount", label: "Amount", format: "currency", align: "right" },
              ],
              monthExpenses.map((expense) => ({
                date: formatDateStr(expense.date),
                category: expense.category.name,
                description: expense.description ?? "—",
                amount: expense.amount,
              })),
              locale === "bn" ? "এই মাসে কোনো খরচের রেকর্ড নেই।" : "No expense records were found for this month."
            ),
          ],
          emptyState: emptyStateFor(locale, title),
          analytics: {
            expenseBreakdown,
            mealBreakdown,
            dueStats: {
              membersWithDue,
              totalDue: summary.totalDue,
              highest:
                summary.members.sort((a, b) => b.due - a.due)[0]?.fullName ?? undefined,
            },
            depositStats: {
              total: summary.totalDeposits,
              highest:
                summary.members.sort((a, b) => b.totalDeposit - a.totalDeposit)[0]?.fullName ??
                undefined,
            },
          },
        },
      };
    }

    if (reportType === "member") {
      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Member Report", periodLabel: month.label },
          summary: [
            { label: "Members", value: String(summary.memberCount) },
            { label: "Meal Rate", value: formatBdt(summary.mealRate) },
            { label: "Total Due", value: formatBdt(summary.totalDue) },
          ],
          columns: [
            { key: "name", label: "Member", align: "left" },
            { key: "phone", label: "Phone", align: "left" },
            { key: "meals", label: "Meals", format: "number", align: "right" },
            { key: "mealCost", label: "Meal Cost", format: "currency", align: "right" },
            { key: "deposit", label: "Deposit", format: "currency", align: "right" },
            { key: "due", label: "Due", format: "currency", align: "right" },
            { key: "advance", label: "Advance", format: "currency", align: "right" },
          ],
          rows: summary.members.map((m) => ({
            name: m.fullName ?? "Unnamed",
            phone: m.phone ?? "—",
            meals: m.mealCount,
            mealCost: m.mealCost,
            deposit: m.totalDeposit,
            due: m.due,
            advance: m.advance,
          })),
        },
      };
    }

    if (reportType === "meal") {
      const entries = await db.mealEntry.findMany({
        where: { messId, meal: { monthId } },
        include: {
          member: { select: { fullName: true } },
          meal: { select: { date: true } },
        },
        orderBy: [{ meal: { date: "desc" } }, { member: { fullName: "asc" } }],
      });

      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Meal Report", periodLabel: month.label },
          summary: [
            { label: "Total Meals", value: String(summary.totalMeals) },
            { label: "Entries", value: String(entries.length) },
            { label: "Meal Rate", value: formatBdt(summary.mealRate) },
          ],
          columns: [
            { key: "date", label: "Date", align: "left" },
            { key: "member", label: "Member", align: "left" },
            { key: "breakfast", label: "Breakfast", format: "portion", align: "center" },
            { key: "lunch", label: "Lunch", format: "portion", align: "center" },
            { key: "dinner", label: "Dinner", format: "portion", align: "center" },
            { key: "total", label: "Total", format: "number", align: "right" },
          ],
          rows: entries.map((e) => ({
            date: formatDateStr(e.meal.date),
            member: e.member.fullName ?? "Unnamed",
            breakfast: formatMealPortion(e.breakfast),
            lunch: formatMealPortion(e.lunch),
            dinner: formatMealPortion(e.dinner),
            total: countMeals(e),
          })),
        },
      };
    }

    if (reportType === "expense") {
      const expenses = await db.expense.findMany({
        where: { messId, monthId, deletedAt: null, status: "APPROVED" },
        include: { category: { select: { name: true } } },
        orderBy: { date: "desc" },
      });

      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Expense Report", periodLabel: month.label },
          summary: [
            { label: "Total Expenses", value: formatBdt(summary.totalExpenses) },
            { label: "Entries", value: String(expenses.length) },
          ],
          columns: [
            { key: "date", label: "Date", align: "left" },
            { key: "category", label: "Category", align: "left" },
            { key: "description", label: "Description", align: "left" },
            { key: "amount", label: "Amount", format: "currency", align: "right" },
          ],
          rows: expenses.map((e) => ({
            date: formatDateStr(e.date),
            category: e.category.name,
            description: e.description ?? "—",
            amount: e.amount,
          })),
        },
      };
    }

    if (reportType === "deposit") {
      const deposits = await db.deposit.findMany({
        where: { messId, monthId, deletedAt: null, status: "APPROVED" },
        include: { member: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Deposit Report", periodLabel: month.label },
          summary: [
            { label: "Total Deposits", value: formatBdt(summary.totalDeposits) },
            { label: "Entries", value: String(deposits.length) },
          ],
          columns: [
            { key: "date", label: "Date", align: "left" },
            { key: "member", label: "Member", align: "left" },
            { key: "amount", label: "Amount", format: "currency", align: "right" },
            { key: "method", label: "Method", align: "left" },
            { key: "type", label: "Type", align: "left" },
            { key: "notes", label: "Notes", align: "left" },
          ],
          rows: deposits.map((d) => ({
            date: formatDateStr(d.createdAt),
            member: d.member.fullName ?? "Unnamed",
            amount: d.amount,
            method: d.method,
            type: d.type,
            notes: d.notes ?? "—",
          })),
        },
      };
    }

    if (reportType === "daily") {
      const targetDate = options?.date ? new Date(options.date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      if (targetDate < monthStart || targetDate > monthEnd) {
        return { success: false, error: "Selected date is outside the chosen month" };
      }

      const [mealEntries, expenses, deposits] = await Promise.all([
        db.mealEntry.findMany({
          where: { messId, meal: { date: { gte: targetDate, lte: dayEnd } } },
          include: {
            member: { select: { fullName: true } },
            meal: { select: { date: true } },
          },
        }),
        db.expense.findMany({
          where: {
            messId,
            monthId,
            deletedAt: null,
            status: "APPROVED",
            date: { gte: targetDate, lte: dayEnd },
          },
          include: { category: { select: { name: true } } },
        }),
        db.deposit.findMany({
          where: {
            messId,
            monthId,
            deletedAt: null,
            status: "APPROVED",
            createdAt: { gte: targetDate, lte: dayEnd },
          },
          include: { member: { select: { fullName: true } } },
        }),
      ]);

      const dayMeals = mealEntries.reduce((s, e) => s + countMeals(e), 0);
      const dayExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const dayDeposits = deposits.reduce((s, d) => s + d.amount, 0);
      const dateLabel = formatDateStr(targetDate);

      const rows: Record<string, string | number>[] = [
        ...mealEntries.map((e) => ({
          type: "Meal",
          detail: `${e.member.fullName ?? "Unnamed"} — B:${formatMealPortion(e.breakfast)} L:${formatMealPortion(e.lunch)} D:${formatMealPortion(e.dinner)}`,
          amount: countMeals(e),
        })),
        ...expenses.map((e) => ({
          type: "Expense",
          detail: `${e.category.name}${e.description ? ` — ${e.description}` : ""}`,
          amount: e.amount,
        })),
        ...deposits.map((d) => ({
          type: "Deposit",
          detail: `${d.member.fullName ?? "Unnamed"} (${d.method})`,
          amount: d.amount,
        })),
      ];

      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Daily Report", periodLabel: dateLabel },
          summary: [
            { label: "Date", value: dateLabel },
            { label: "Meals", value: String(dayMeals) },
            { label: "Expenses", value: formatBdt(dayExpenses) },
            { label: "Deposits", value: formatBdt(dayDeposits) },
          ],
          columns: [
            { key: "type", label: "Type", align: "left" },
            { key: "detail", label: "Detail", align: "left" },
            { key: "amount", label: "Amount", format: "currency", align: "right" },
          ],
          rows,
        },
      };
    }

    if (reportType === "weekly") {
      const weekEnd = options?.date ? new Date(options.date) : new Date();
      weekEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const clampedStart = weekStart < monthStart ? monthStart : weekStart;
      const clampedEnd = weekEnd > monthEnd ? monthEnd : weekEnd;

      const [mealEntries, expenses, deposits] = await Promise.all([
        db.mealEntry.findMany({
          where: {
            messId,
            meal: { monthId, date: { gte: clampedStart, lte: clampedEnd } },
          },
        }),
        db.expense.findMany({
          where: {
            messId,
            monthId,
            deletedAt: null,
            status: "APPROVED",
            date: { gte: clampedStart, lte: clampedEnd },
          },
        }),
        db.deposit.findMany({
          where: {
            messId,
            monthId,
            deletedAt: null,
            status: "APPROVED",
            createdAt: { gte: clampedStart, lte: clampedEnd },
          },
        }),
      ]);

      const weekMeals = mealEntries.reduce((s, e) => s + countMeals(e), 0);
      const weekExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const weekDeposits = deposits.reduce((s, d) => s + d.amount, 0);

      return {
        success: true,
        data: {
          meta: {
            ...baseMeta,
            reportTitle: "Weekly Report",
            periodLabel: `${formatDateStr(clampedStart)} — ${formatDateStr(clampedEnd)}`,
          },
          summary: [
            { label: "Period", value: `${formatDateStr(clampedStart)} to ${formatDateStr(clampedEnd)}` },
            { label: "Meals", value: String(weekMeals) },
            { label: "Expenses", value: formatBdt(weekExpenses) },
            { label: "Deposits", value: formatBdt(weekDeposits) },
            { label: "Net", value: formatBdt(weekDeposits - weekExpenses) },
          ],
          columns: [
            { key: "metric", label: "Metric", align: "left" },
            { key: "value", label: "Value", align: "right" },
          ],
          rows: [
            { metric: "Total Meals", value: weekMeals },
            { metric: "Total Expenses", value: formatBdt(weekExpenses) },
            { metric: "Total Deposits", value: formatBdt(weekDeposits) },
            { metric: "Meal Entries", value: mealEntries.length },
            { metric: "Expense Entries", value: expenses.length },
            { metric: "Deposit Entries", value: deposits.length },
          ],
        },
      };
    }

    if (reportType === "rent" || reportType === "utility" || reportType === "shared_expense") {
      const { getBillCategoryLabel: getCat } = await import("@/lib/bills/categories");
      const filtered = summary.bills.filter((b) => {
        if (reportType === "rent") return b.category === "HOUSE_RENT";
        if (reportType === "utility")
          return ["ELECTRICITY", "WATER", "GAS", "INTERNET", "GENERATOR"].includes(b.category);
        return (
          b.category !== "HOUSE_RENT" &&
          !["ELECTRICITY", "WATER", "GAS", "INTERNET", "GENERATOR"].includes(b.category)
        );
      });

      const title =
        reportType === "rent"
          ? "Rent Report"
          : reportType === "utility"
            ? "Utility Report"
            : "Shared Expense Report";

      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: title, periodLabel: month.label },
          summary: [
            { label: "Bill Count", value: String(filtered.length) },
            { label: "Total Amount", value: formatBdt(filtered.reduce((s, b) => s + b.amount, 0)) },
          ],
          columns: [
            { key: "category", label: "Category", align: "left" },
            { key: "amount", label: "Amount", format: "currency", align: "right" },
            { key: "status", label: "Status", align: "left" },
            { key: "dueDate", label: "Due Date", align: "left" },
            { key: "description", label: "Description", align: "left" },
          ],
          rows: filtered.map((b) => ({
            category: getCat(b.category),
            amount: b.amount,
            status: b.status,
            dueDate: b.dueDate ? formatDateStr(b.dueDate) : "—",
            description: b.description ?? "",
          })),
        },
      };
    }

    if (reportType === "bill_settlement") {
      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Bill Settlement Report", periodLabel: month.label },
          summary: [
            { label: "Total Bills", value: formatBdt(summary.billKpis.totalSharedBills) },
            { label: "Total Due", value: formatBdt(summary.totalDue) },
          ],
          columns: [
            { key: "name", label: "Member", align: "left" },
            { key: "billShare", label: "Bill Share", format: "currency", align: "right" },
            { key: "mealCost", label: "Meal Cost", format: "currency", align: "right" },
            { key: "totalCost", label: "Total Cost", format: "currency", align: "right" },
            { key: "deposit", label: "Deposit", format: "currency", align: "right" },
            { key: "due", label: "Due", format: "currency", align: "right" },
          ],
          rows: summary.members.map((m) => ({
            name: m.fullName ?? "Unnamed",
            billShare: m.totalBillShare,
            mealCost: m.mealCost,
            totalCost: m.totalCost,
            deposit: m.totalDeposit,
            due: m.due,
          })),
        },
      };
    }

    if (reportType === "due") {
      const dueMembers = summary.members.filter((m) => m.due > 0).sort((a, b) => b.due - a.due);
      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Due Report", periodLabel: month.label },
          summary: [
            { label: "Members With Due", value: String(dueMembers.length) },
            { label: "Total Due", value: formatBdt(summary.totalDue) },
            {
              label: "Highest Due",
              value: formatBdt(dueMembers[0]?.due ?? 0),
            },
            {
              label: "Collection Rate",
              value: `${Math.round(((summary.totalDeposits / Math.max(summary.totalDeposits + summary.totalDue, 1)) * 100))}%`,
            },
          ],
          columns: [
            { key: "name", label: "Member", align: "left" },
            { key: "totalCost", label: "Total Cost", format: "currency", align: "right" },
            { key: "deposit", label: "Deposit", format: "currency", align: "right" },
            { key: "due", label: "Due", format: "currency", align: "right" },
          ],
          rows: dueMembers.map((m) => ({
            name: m.fullName ?? "Unnamed",
            totalCost: m.totalCost,
            deposit: m.totalDeposit,
            due: m.due,
          })),
          analytics: {
            dueStats: {
              membersWithDue: dueMembers.length,
              totalDue: summary.totalDue,
              highest: dueMembers[0]?.fullName ?? undefined,
            },
          },
        },
      };
    }

    if (reportType === "bazaar") {
      const bazaars = await db.bazaarTask.findMany({
        where: {
          messId,
          deletedAt: null,
          shoppingDate: { gte: monthStart, lte: monthEnd },
        },
        include: {
          assignment: { include: { member: { select: { fullName: true } } } },
          items: { select: { name: true } },
          submission: true,
        },
        orderBy: { shoppingDate: "desc" },
      });
      const total = bazaars.reduce((s, b) => s + (b.submission?.actualCost ?? b.expectedBudget), 0);
      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Bazaar Report", periodLabel: month.label },
          summary: [
            { label: "Total Bazaar Cost", value: formatBdt(total) },
            { label: "Entries", value: String(bazaars.length) },
          ],
          columns: [
            { key: "date", label: "Date", align: "left" },
            { key: "member", label: "Member", align: "left" },
            { key: "items", label: "Description", align: "left" },
            { key: "amount", label: "Amount", format: "currency", align: "right" },
            { key: "status", label: "Status", align: "left" },
          ],
          rows: bazaars.map((b) => ({
            date: formatDateStr(b.shoppingDate),
            member: b.assignment?.member.fullName ?? "—",
            items: b.items.map((item) => item.name).join(", ") || "—",
            amount: b.submission?.actualCost ?? b.expectedBudget,
            status: b.status,
          })),
          emptyState: emptyStateFor(locale, "Bazaar Report"),
        },
      };
    }

    if (reportType === "transaction") {
      const transactions = await db.transaction.findMany({
        where: {
          messId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        include: { member: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      });
      return {
        success: true,
        data: {
          meta: { ...baseMeta, reportTitle: "Transaction Report", periodLabel: month.label },
          summary: [
            { label: "Transactions", value: String(transactions.length) },
            {
              label: "Total Credit",
              value: formatBdt(
                transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0)
              ),
            },
            {
              label: "Total Debit",
              value: formatBdt(
                transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0)
              ),
            },
          ],
          columns: [
            { key: "date", label: "Date", align: "left" },
            { key: "member", label: "Member", align: "left" },
            { key: "type", label: "Type", align: "left" },
            { key: "amount", label: "Amount", format: "currency", align: "right" },
            { key: "description", label: "Description", align: "left" },
          ],
          rows: transactions.map((t) => ({
            date: formatDateStr(t.createdAt),
            member: t.member?.fullName ?? "—",
            type: t.type,
            amount: t.amount,
            description: t.description ?? "—",
          })),
        },
      };
    }

    if (reportType === "yearly") {
      const yearMonths = await db.messMonth.findMany({
        where: { messId, year: month.year, deletedAt: null },
        orderBy: { month: "asc" },
      });

      const rows: Record<string, string | number>[] = [];
      let yearMeals = 0;
      let yearExpenses = 0;
      let yearDeposits = 0;

      for (const m of yearMonths) {
        const mSummary = await getMonthSummary(messId, m.id);
        if (!mSummary) continue;
        yearMeals += mSummary.totalMeals;
        yearExpenses += mSummary.totalExpenses;
        yearDeposits += mSummary.totalDeposits;
        rows.push({
          month: m.label,
          meals: mSummary.totalMeals,
          mealRate: formatBdt(mSummary.mealRate),
          expenses: mSummary.totalExpenses,
          deposits: mSummary.totalDeposits,
          balance: mSummary.totalDeposits - mSummary.totalExpenses,
          status: m.status,
        });
      }

      return {
        success: true,
        data: {
          meta: {
            ...baseMeta,
            reportTitle: "Yearly Report",
            periodLabel: String(month.year),
          },
          summary: [
            { label: "Year", value: String(month.year) },
            { label: "Months", value: String(yearMonths.length) },
            { label: "Total Meals", value: String(yearMeals) },
            { label: "Total Expenses", value: formatBdt(yearExpenses) },
            { label: "Total Deposits", value: formatBdt(yearDeposits) },
          ],
          columns: [
            { key: "month", label: "Month", align: "left" },
            { key: "meals", label: "Meals", format: "number", align: "right" },
            { key: "mealRate", label: "Meal Rate", align: "right" },
            { key: "expenses", label: "Expenses", format: "currency", align: "right" },
            { key: "deposits", label: "Deposits", format: "currency", align: "right" },
            { key: "balance", label: "Balance", format: "currency", align: "right", allowNegative: true },
            { key: "status", label: "Status", align: "left" },
          ],
          rows,
        },
      };
    }

    return { success: false, error: "Unknown report type" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to load report" };
  }
}

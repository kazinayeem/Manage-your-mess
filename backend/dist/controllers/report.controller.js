"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessMonthsForReports = getMessMonthsForReports;
exports.fetchReportData = fetchReportData;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const calculations_1 = require("../utils/calculations");
const categories_1 = require("../utils/bills/categories");
function formatBdt(amount) {
    const hasDecimals = Math.round(amount * 100) % 100 !== 0;
    return `৳${amount.toLocaleString("en-US", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
    })}`;
}
function formatDateStr(date) {
    return date.toISOString().split("T")[0];
}
function monthDateRange(year, month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}
function makeSection(key, title, columns, rows, emptyMessage) {
    return { key, title, columns, rows, emptyMessage };
}
async function getMessMonthsForReports(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const months = await database_1.prisma.messMonth.findMany({
        where: { messId, deletedAt: null },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        select: { id: true, label: true, year: true, month: true, status: true },
    });
    return (0, response_1.sendSuccess)(res, months);
}
async function fetchReportData(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.query.messId;
    const monthId = req.query.monthId;
    const reportType = req.query.reportType || "monthly";
    const locale = req.query.locale === "bn" ? "bn" : "en";
    if (!messId || !monthId)
        throw new errors_1.ValidationError("Mess ID and Month ID required");
    const mess = await database_1.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess)
        throw new errors_1.NotFoundError("Mess not found");
    const month = await database_1.prisma.messMonth.findFirst({
        where: { id: monthId, messId, deletedAt: null },
    });
    if (!month)
        throw new errors_1.NotFoundError("Month not found");
    // Load Month Summary Data
    const [members, expenses, deposits, mealEntries, bills] = await Promise.all([
        database_1.prisma.member.findMany({
            where: { messId, deletedAt: null, status: "ACTIVE" },
            include: { user: { select: { email: true, image: true } } },
        }),
        database_1.prisma.expense.findMany({
            where: { messId, monthId, deletedAt: null, status: "APPROVED" },
            include: { category: true },
        }),
        database_1.prisma.deposit.findMany({
            where: { messId, monthId, deletedAt: null, status: "APPROVED" },
        }),
        database_1.prisma.mealEntry.findMany({
            where: { messId, meal: { monthId } },
            select: { memberId: true, breakfast: true, lunch: true, dinner: true },
        }),
        database_1.prisma.bill.findMany({
            where: { messId, monthId, deletedAt: null },
            include: { memberShares: true },
        }),
    ]);
    const mealExpenses = expenses.filter((e) => e.category.isMealCost || ["grocery", "bazaar"].includes(e.category.name.toLowerCase()));
    const totalMealExpenses = mealExpenses.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalDeposits = deposits.reduce((s, d) => s + d.amount, 0);
    const totalMeals = mealEntries.reduce((s, e) => s + (0, calculations_1.countMeals)(e), 0);
    const mealRate = (0, calculations_1.calculateMealRate)(totalMealExpenses, totalMeals);
    const totalSharedBills = bills.reduce((s, b) => s + b.amount, 0);
    let totalRent = 0;
    let totalUtilities = 0;
    for (const b of bills) {
        if ((0, categories_1.isRentCategory)(b.category))
            totalRent += b.amount;
        else if ((0, categories_1.isUtilityCategory)(b.category))
            totalUtilities += b.amount;
    }
    const memberBillMap = new Map();
    for (const m of members)
        memberBillMap.set(m.id, (0, categories_1.emptyBillBreakdown)());
    for (const bill of bills) {
        for (const share of bill.memberShares) {
            const current = memberBillMap.get(share.memberId) ?? (0, categories_1.emptyBillBreakdown)();
            memberBillMap.set(share.memberId, (0, categories_1.addToBillBreakdown)(current, bill.category, share.amount));
        }
    }
    const memberStats = members.map((m) => {
        const meals = mealEntries
            .filter((e) => e.memberId === m.id)
            .reduce((s, e) => s + (0, calculations_1.countMeals)(e), 0);
        const memberDeposits = deposits
            .filter((d) => d.memberId === m.id)
            .reduce((s, d) => s + d.amount, 0);
        const billShares = memberBillMap.get(m.id) ?? (0, categories_1.emptyBillBreakdown)();
        return {
            ...m,
            ...(0, calculations_1.calculateMemberFinancials)({
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
    const billsByCategory = bills.reduce((acc, b) => {
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
        return (0, response_1.sendSuccess)(res, {
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
                makeSection("memberDetails", locale === "bn" ? "সদস্য বিস্তারিত" : "Member Breakdown", [
                    { key: "name", label: "Member", align: "left" },
                    { key: "mealCount", label: "Meals", format: "number", align: "right" },
                    { key: "deposit", label: "Deposit", format: "currency", align: "right" },
                    { key: "due", label: "Due", format: "currency", align: "right" },
                    { key: "balance", label: "Balance", format: "currency", align: "right" },
                ], memberStats.map((m) => ({
                    name: m.fullName ?? "Unnamed",
                    mealCount: m.mealCount,
                    deposit: m.totalDeposit,
                    due: m.due,
                    balance: m.advance > 0 ? m.advance : -m.due,
                }))),
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
    return (0, response_1.sendSuccess)(res, {
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
//# sourceMappingURL=report.controller.js.map
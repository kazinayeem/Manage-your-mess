"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardAnalytics = getDashboardAnalytics;
exports.getExpenseTrend = getExpenseTrend;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getDashboardAnalytics(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const [totalMembers, expensesAggregate, depositsAggregate, mealsAggregate, recentExpenses, membersList,] = await Promise.all([
        database_1.prisma.member.count({ where: { messId, deletedAt: null, status: "ACTIVE" } }),
        database_1.prisma.expense.aggregate({
            where: { messId, deletedAt: null, status: "APPROVED" },
            _sum: { amount: true },
        }),
        database_1.prisma.deposit.aggregate({
            where: { messId, deletedAt: null, status: "APPROVED" },
            _sum: { amount: true },
        }),
        database_1.prisma.mealEntry.aggregate({
            where: { messId },
            _sum: { breakfast: true, lunch: true, dinner: true },
        }),
        database_1.prisma.expense.findMany({
            where: { messId, deletedAt: null },
            orderBy: { date: "desc" },
            take: 5,
            include: { category: { select: { name: true } } },
        }),
        database_1.prisma.member.findMany({
            where: { messId, deletedAt: null },
            select: { totalDue: true, totalDeposit: true },
        }),
    ]);
    const totalExpense = expensesAggregate._sum.amount || 0;
    const totalDeposit = depositsAggregate._sum.amount || 0;
    const totalMeals = (mealsAggregate._sum.breakfast || 0) +
        (mealsAggregate._sum.lunch || 0) +
        (mealsAggregate._sum.dinner || 0);
    const mealRate = totalMeals > 0 ? Number((totalExpense / totalMeals).toFixed(2)) : 0;
    const totalDues = membersList.reduce((acc, m) => acc + (m.totalDue || 0), 0);
    return (0, response_1.sendSuccess)(res, {
        totalMembers,
        totalExpense,
        totalDeposit,
        totalMeals,
        mealRate,
        totalDues,
        recentExpenses,
    });
}
async function getExpenseTrend(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    // Get expenses grouped by date (or category)
    const expenses = await database_1.prisma.expense.findMany({
        where: { messId, deletedAt: null },
        select: { amount: true, date: true, category: { select: { name: true } } },
        orderBy: { date: "asc" },
    });
    return (0, response_1.sendSuccess)(res, expenses);
}
//# sourceMappingURL=analytics.controller.js.map
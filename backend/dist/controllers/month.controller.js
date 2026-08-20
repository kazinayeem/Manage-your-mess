"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessMonths = getMessMonths;
exports.getActiveMonth = getActiveMonth;
exports.getMonthSummary = getMonthSummary;
exports.startNewMonth = startNewMonth;
exports.closeMonth = closeMonth;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const access_service_1 = require("../services/access.service");
const financial_service_1 = require("../services/financial.service");
async function getMessMonths(req, res) {
    const messId = req.params.messId || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MESS_READ");
    const months = await database_1.prisma.messMonth.findMany({
        where: { messId, deletedAt: null },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return (0, response_1.sendList)(res, months, { total: months.length });
}
async function getActiveMonth(req, res) {
    const messId = req.params.messId || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MESS_READ");
    const mess = await database_1.prisma.mess.findUnique({
        where: { id: messId },
        include: { currentMonth: true },
    });
    if (!mess?.currentMonth) {
        throw new errors_1.NotFoundError("No active month found for this mess");
    }
    return (0, response_1.sendSuccess)(res, mess.currentMonth);
}
async function getMonthSummary(req, res) {
    const { monthId } = req.params;
    const month = await database_1.prisma.messMonth.findUnique({ where: { id: monthId } });
    if (!month || month.deletedAt)
        throw new errors_1.NotFoundError("Month not found");
    await (0, access_service_1.requireMessAccess)(req.user, month.messId, "MESS_READ");
    const summary = await (0, financial_service_1.calculateMonthSummary)(month.messId, monthId);
    if (!summary)
        throw new errors_1.NotFoundError("Could not calculate month summary");
    return (0, response_1.sendSuccess)(res, summary);
}
async function startNewMonth(req, res) {
    const messId = req.params.messId || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MESS_UPDATE");
    const { label } = req.body;
    const mess = await database_1.prisma.mess.findUnique({
        where: { id: messId },
        include: { currentMonth: true },
    });
    if (!mess)
        throw new errors_1.NotFoundError("Mess not found");
    const newMonth = await database_1.prisma.$transaction(async (tx) => {
        // If there is an active month, close and snapshot it
        if (mess.currentMonth) {
            const summary = await (0, financial_service_1.calculateMonthSummary)(messId, mess.currentMonth.id);
            if (summary) {
                await tx.messMonth.update({
                    where: { id: mess.currentMonth.id },
                    data: {
                        status: "CLOSED",
                        closedAt: new Date(),
                        totalMeals: summary.totalMeals,
                        totalExpenses: summary.totalExpenses,
                        totalDeposits: summary.totalDeposits,
                        mealRate: summary.mealRate,
                        sharedCost: summary.billKpis.totalSharedBills,
                        snapshot: JSON.stringify(summary.members),
                    },
                });
            }
        }
        let nextYear = new Date().getFullYear();
        let nextMonthNumber = new Date().getMonth() + 1;
        if (mess.currentMonth) {
            nextYear = mess.currentMonth.year;
            nextMonthNumber = mess.currentMonth.month + 1;
            if (nextMonthNumber > 12) {
                nextMonthNumber = 1;
                nextYear += 1;
            }
        }
        const monthDate = new Date(nextYear, nextMonthNumber - 1, 1);
        const monthLabel = label || monthDate.toLocaleString("default", { month: "long", year: "numeric" });
        // Check if month already exists
        const existing = await tx.messMonth.findUnique({
            where: { messId_year_month: { messId, year: nextYear, month: nextMonthNumber } },
        });
        let createdMonth;
        if (existing) {
            createdMonth = await tx.messMonth.update({
                where: { id: existing.id },
                data: { status: "ACTIVE", deletedAt: null },
            });
        }
        else {
            createdMonth = await tx.messMonth.create({
                data: {
                    messId,
                    year: nextYear,
                    month: nextMonthNumber,
                    label: monthLabel,
                    status: "ACTIVE",
                },
            });
        }
        await tx.mess.update({
            where: { id: messId },
            data: { currentMonthId: createdMonth.id },
        });
        await tx.auditLog.create({
            data: {
                messId,
                userId: req.user.id,
                action: "CREATE",
                entity: "MessMonth",
                entityId: createdMonth.id,
                newData: JSON.stringify({ label: monthLabel, year: nextYear, month: nextMonthNumber }),
            },
        });
        return createdMonth;
    });
    return (0, response_1.sendSuccess)(res, newMonth, "New month started successfully", 201);
}
async function closeMonth(req, res) {
    const { monthId } = req.params;
    const month = await database_1.prisma.messMonth.findUnique({ where: { id: monthId } });
    if (!month || month.deletedAt)
        throw new errors_1.NotFoundError("Month not found");
    await (0, access_service_1.requireMessAccess)(req.user, month.messId, "MESS_UPDATE");
    const summary = await (0, financial_service_1.recalculateMonth)(month.messId, monthId);
    if (!summary)
        throw new errors_1.NotFoundError("Month summary calculation failed");
    await database_1.prisma.$transaction(async (tx) => {
        await tx.messMonth.update({
            where: { id: monthId },
            data: {
                status: "CLOSED",
                closedAt: new Date(),
                snapshot: JSON.stringify(summary.members),
            },
        });
        await tx.auditLog.create({
            data: {
                messId: month.messId,
                userId: req.user.id,
                action: "UPDATE",
                entity: "MessMonth",
                entityId: monthId,
                newData: JSON.stringify({ status: "CLOSED" }),
            },
        });
    });
    return (0, response_1.sendSuccess)(res, null, "Month closed and settled successfully");
}
//# sourceMappingURL=month.controller.js.map
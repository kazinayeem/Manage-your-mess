"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeals = getMeals;
exports.getTodayMeal = getTodayMeal;
exports.addBulkMealEntries = addBulkMealEntries;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const access_service_1 = require("../services/access.service");
const financial_service_1 = require("../services/financial.service");
async function getMeals(req, res) {
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID is required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MEAL_READ");
    const dateStr = req.query.date;
    const monthId = req.query.monthId;
    let where = { messId };
    if (monthId)
        where.monthId = monthId;
    if (dateStr) {
        const d = new Date(dateStr);
        where.date = {
            gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(d).setHours(23, 59, 59, 999)),
        };
    }
    const meals = await database_1.prisma.meal.findMany({
        where,
        include: {
            entries: {
                include: {
                    member: {
                        include: { user: { select: { id: true, name: true, image: true } } },
                    },
                },
            },
        },
        orderBy: { date: "desc" },
        take: 60,
    });
    return (0, response_1.sendList)(res, meals, { total: meals.length });
}
async function getTodayMeal(req, res) {
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MEAL_READ");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meal = await database_1.prisma.meal.findFirst({
        where: { messId, date: today },
        include: {
            entries: {
                include: {
                    member: {
                        include: { user: { select: { id: true, name: true } } },
                    },
                },
            },
        },
    });
    if (!meal) {
        return (0, response_1.sendSuccess)(res, {
            date: today,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            entries: [],
        });
    }
    return (0, response_1.sendSuccess)(res, meal);
}
async function addBulkMealEntries(req, res) {
    const messId = req.params.messId || req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MEAL_CREATE");
    const { date, entries } = req.body;
    if (!date || !Array.isArray(entries) || entries.length === 0) {
        throw new errors_1.ValidationError("Date and array of meal entries are required");
    }
    const mess = await database_1.prisma.mess.findUnique({
        where: { id: messId },
        include: { currentMonth: true },
    });
    if (!mess)
        throw new errors_1.NotFoundError("Mess not found");
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const targetMonthId = req.body.monthId || mess.currentMonthId;
    await database_1.prisma.$transaction(async (tx) => {
        let meal = await tx.meal.findFirst({
            where: { messId, date: targetDate },
        });
        if (!meal) {
            meal = await tx.meal.create({
                data: {
                    messId,
                    monthId: targetMonthId,
                    date: targetDate,
                },
            });
        }
        for (const item of entries) {
            const { memberId, breakfast = 0, lunch = 0, dinner = 0 } = item;
            if (!memberId)
                continue;
            await tx.mealEntry.upsert({
                where: { mealId_memberId: { mealId: meal.id, memberId } },
                update: {
                    breakfast: Number(breakfast),
                    lunch: Number(lunch),
                    dinner: Number(dinner),
                },
                create: {
                    messId,
                    mealId: meal.id,
                    memberId,
                    breakfast: Number(breakfast),
                    lunch: Number(lunch),
                    dinner: Number(dinner),
                },
            });
        }
        // Recalculate container totals
        const allEntries = await tx.mealEntry.findMany({ where: { mealId: meal.id } });
        const totalBreakfast = allEntries.reduce((s, e) => s + e.breakfast, 0);
        const totalLunch = allEntries.reduce((s, e) => s + e.lunch, 0);
        const totalDinner = allEntries.reduce((s, e) => s + e.dinner, 0);
        await tx.meal.update({
            where: { id: meal.id },
            data: {
                breakfast: totalBreakfast,
                lunch: totalLunch,
                dinner: totalDinner,
            },
        });
        await tx.auditLog.create({
            data: {
                messId,
                userId: req.user.id,
                action: "UPDATE",
                entity: "Meal",
                entityId: meal.id,
                newData: JSON.stringify({ date: targetDate, count: entries.length }),
            },
        });
    });
    if (targetMonthId) {
        await (0, financial_service_1.recalculateMonth)(messId, targetMonthId);
    }
    return (0, response_1.sendSuccess)(res, null, "Meal entries saved successfully");
}
//# sourceMappingURL=meal.controller.js.map
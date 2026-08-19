"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeals = getMeals;
exports.getTodayMeal = getTodayMeal;
exports.addOrUpdateMealEntry = addOrUpdateMealEntry;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getMeals(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID is required");
    const dateStr = req.query.date;
    let dateFilter = undefined;
    if (dateStr) {
        const d = new Date(dateStr);
        dateFilter = {
            gte: new Date(d.setHours(0, 0, 0, 0)),
            lte: new Date(d.setHours(23, 59, 59, 999)),
        };
    }
    const meals = await database_1.prisma.meal.findMany({
        where: {
            messId,
            ...(dateFilter && { date: dateFilter }),
        },
        include: {
            entries: {
                include: {
                    member: {
                        include: { user: { select: { name: true, image: true } } },
                    },
                },
            },
        },
        orderBy: { date: "desc" },
        take: 30,
    });
    return (0, response_1.sendList)(res, meals, { total: meals.length });
}
async function getTodayMeal(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
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
async function addOrUpdateMealEntry(req, res) {
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { memberId, breakfast = 0, lunch = 0, dinner = 0, date } = req.body;
    const targetMemberId = memberId || req.user?.memberId;
    if (!targetMemberId)
        throw new errors_1.ValidationError("Member ID required");
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    // Find or create daily Meal container
    let meal = await database_1.prisma.meal.findFirst({
        where: { messId, date: targetDate },
    });
    if (!meal) {
        meal = await database_1.prisma.meal.create({
            data: { messId, date: targetDate },
        });
    }
    // Upsert entry
    const entry = await database_1.prisma.mealEntry.upsert({
        where: {
            mealId_memberId: { mealId: meal.id, memberId: targetMemberId },
        },
        update: { breakfast, lunch, dinner },
        create: {
            messId,
            mealId: meal.id,
            memberId: targetMemberId,
            breakfast,
            lunch,
            dinner,
        },
    });
    // Re-calculate totals
    const allEntries = await database_1.prisma.mealEntry.findMany({
        where: { mealId: meal.id },
    });
    const totalBreakfast = allEntries.reduce((sum, e) => sum + e.breakfast, 0);
    const totalLunch = allEntries.reduce((sum, e) => sum + e.lunch, 0);
    const totalDinner = allEntries.reduce((sum, e) => sum + e.dinner, 0);
    await database_1.prisma.meal.update({
        where: { id: meal.id },
        data: { breakfast: totalBreakfast, lunch: totalLunch, dinner: totalDinner },
    });
    return (0, response_1.sendSuccess)(res, entry, "Meal entry updated");
}
//# sourceMappingURL=meal.controller.js.map
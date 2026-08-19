import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getMeals(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID is required");

  const dateStr = req.query.date as string;
  let dateFilter = undefined;
  if (dateStr) {
    const d = new Date(dateStr);
    dateFilter = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  const meals = await prisma.meal.findMany({
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

  return sendList(res, meals, { total: meals.length });
}

export async function getTodayMeal(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const meal = await prisma.meal.findFirst({
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
    return sendSuccess(res, {
      date: today,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      entries: [],
    });
  }

  return sendSuccess(res, meal);
}

export async function addOrUpdateMealEntry(req: Request, res: Response) {
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const { memberId, breakfast = 0, lunch = 0, dinner = 0, date } = req.body;
  const targetMemberId = memberId || req.user?.memberId;

  if (!targetMemberId) throw new ValidationError("Member ID required");

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  // Find or create daily Meal container
  let meal = await prisma.meal.findFirst({
    where: { messId, date: targetDate },
  });

  if (!meal) {
    meal = await prisma.meal.create({
      data: { messId, date: targetDate },
    });
  }

  // Upsert entry
  const entry = await prisma.mealEntry.upsert({
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
  const allEntries = await prisma.mealEntry.findMany({
    where: { mealId: meal.id },
  });

  const totalBreakfast = allEntries.reduce((sum, e) => sum + e.breakfast, 0);
  const totalLunch = allEntries.reduce((sum, e) => sum + e.lunch, 0);
  const totalDinner = allEntries.reduce((sum, e) => sum + e.dinner, 0);

  await prisma.meal.update({
    where: { id: meal.id },
    data: { breakfast: totalBreakfast, lunch: totalLunch, dinner: totalDinner },
  });

  return sendSuccess(res, entry, "Meal entry updated");
}

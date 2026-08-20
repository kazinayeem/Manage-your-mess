import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, ValidationError, NotFoundError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { requireMessAccess } from "../services/access.service";
import { recalculateMonth } from "../services/financial.service";

export async function getMeals(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID is required");

  await requireMessAccess(req.user!, messId, "MEAL_READ");

  const dateStr = req.query.date as string;
  const monthId = req.query.monthId as string;

  let where: any = { messId };
  if (monthId) where.monthId = monthId;
  if (dateStr) {
    const d = new Date(dateStr);
    where.date = {
      gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
      lte: new Date(new Date(d).setHours(23, 59, 59, 999)),
    };
  }

  const meals = await prisma.meal.findMany({
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

  return sendList(res, meals, { total: meals.length });
}

export async function getTodayMeal(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "MEAL_READ");

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

export async function addBulkMealEntries(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "MEAL_CREATE");

  const { date, entries } = req.body;
  if (!date || !Array.isArray(entries) || entries.length === 0) {
    throw new ValidationError("Date and array of meal entries are required");
  }

  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: { currentMonth: true },
  });
  if (!mess) throw new NotFoundError("Mess not found");

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const targetMonthId = req.body.monthId || mess.currentMonthId;

  await prisma.$transaction(async (tx) => {
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
      if (!memberId) continue;

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
        userId: req.user!.id,
        action: "UPDATE",
        entity: "Meal",
        entityId: meal.id,
        newData: JSON.stringify({ date: targetDate, count: entries.length }),
      },
    });
  });

  if (targetMonthId) {
    await recalculateMonth(messId, targetMonthId);
  }

  return sendSuccess(res, null, "Meal entries saved successfully");
}

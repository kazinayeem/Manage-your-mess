import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { requireMessAccess } from "../services/access.service";
import { calculateMonthSummary, recalculateMonth } from "../services/financial.service";

export async function getMessMonths(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId;
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "MESS_READ");

  const months = await prisma.messMonth.findMany({
    where: { messId, deletedAt: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return sendList(res, months, { total: months.length });
}

export async function getActiveMonth(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId;
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "MESS_READ");

  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: { currentMonth: true },
  });

  if (!mess?.currentMonth) {
    throw new NotFoundError("No active month found for this mess");
  }

  return sendSuccess(res, mess.currentMonth);
}

export async function getMonthSummary(req: Request, res: Response) {
  const { monthId } = req.params;
  const month = await prisma.messMonth.findUnique({ where: { id: monthId } });
  if (!month || month.deletedAt) throw new NotFoundError("Month not found");

  await requireMessAccess(req.user!, month.messId, "MESS_READ");

  const summary = await calculateMonthSummary(month.messId, monthId);
  if (!summary) throw new NotFoundError("Could not calculate month summary");

  return sendSuccess(res, summary);
}

export async function startNewMonth(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId;
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "MESS_UPDATE");

  const { label } = req.body;

  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: { currentMonth: true },
  });
  if (!mess) throw new NotFoundError("Mess not found");

  const newMonth = await prisma.$transaction(async (tx) => {
    // If there is an active month, close and snapshot it
    if (mess.currentMonth) {
      const summary = await calculateMonthSummary(messId, mess.currentMonth.id);
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
    } else {
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
        userId: req.user!.id,
        action: "CREATE",
        entity: "MessMonth",
        entityId: createdMonth.id,
        newData: JSON.stringify({ label: monthLabel, year: nextYear, month: nextMonthNumber }),
      },
    });

    return createdMonth;
  });

  return sendSuccess(res, newMonth, "New month started successfully", 201);
}

export async function closeMonth(req: Request, res: Response) {
  const { monthId } = req.params;
  const month = await prisma.messMonth.findUnique({ where: { id: monthId } });
  if (!month || month.deletedAt) throw new NotFoundError("Month not found");

  await requireMessAccess(req.user!, month.messId, "MESS_UPDATE");

  const summary = await recalculateMonth(month.messId, monthId);
  if (!summary) throw new NotFoundError("Month summary calculation failed");

  await prisma.$transaction(async (tx) => {
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
        userId: req.user!.id,
        action: "UPDATE",
        entity: "MessMonth",
        entityId: monthId,
        newData: JSON.stringify({ status: "CLOSED" }),
      },
    });
  });

  return sendSuccess(res, null, "Month closed and settled successfully");
}

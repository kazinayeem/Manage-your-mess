import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getBazaarTasks(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const tasks = await prisma.bazaarTask.findMany({
    where: { messId, deletedAt: null },
    include: {
      assignment: {
        include: {
          member: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      },
      submission: {
        include: { submittedBy: { select: { id: true, name: true } } },
      },
      items: true,
      receipts: true,
    },
    orderBy: { shoppingDate: "desc" },
  });

  return sendList(res, tasks, { total: tasks.length });
}

export async function createBazaarTask(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const { title, date, budget, notes, assignedMemberId } = req.body;
  if (!title || !date) throw new ValidationError("Title and date are required");

  const task = await prisma.bazaarTask.create({
    data: {
      messId,
      title,
      shoppingDate: new Date(date),
      expectedBudget: Number(budget || 0),
      notes,
      createdById: req.user.id,
      status: "ASSIGNED",
      ...(assignedMemberId && {
        assignment: {
          create: {
            memberId: assignedMemberId,
            assignedById: req.user.id,
            expectedCompletionDate: new Date(date),
          },
        },
      }),
    },
    include: { assignment: true },
  });

  return sendSuccess(res, task, "Bazaar task created", 201);
}

export async function submitBazaar(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { taskId } = req.params;
  const { totalAmount, notes } = req.body;

  const submission = await prisma.bazaarSubmission.create({
    data: {
      taskId,
      submittedById: req.user.id,
      actualCost: Number(totalAmount || 0),
      notes,
    },
  });

  await prisma.bazaarTask.update({
    where: { id: taskId },
    data: { status: "PENDING_REVIEW" },
  });

  return sendSuccess(res, submission, "Bazaar submitted for review");
}

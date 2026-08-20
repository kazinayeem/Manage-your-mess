import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError, ForbiddenError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { requireMessAccess } from "../services/access.service";
import { recalculateMonth, logFinancialTransaction } from "../services/financial.service";

export async function getBazaarTasks(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "BAZAAR_MANAGE");

  const tasks = await prisma.bazaarTask.findMany({
    where: { messId, deletedAt: null },
    include: {
      assignees: {
        include: {
          member: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      },
      assignment: {
        include: {
          member: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      },
      paidBy: { select: { id: true, fullName: true } },
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
  const messId = req.params.messId || req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  await requireMessAccess(req.user!, messId, "BAZAAR_MANAGE");

  const { title, shoppingDate, date, expectedBudget, budget, priority, description, notes, memberIds, memberId, items } = req.body;
  if (!title || (!shoppingDate && !date)) throw new ValidationError("Title and shopping date are required");

  const sDate = new Date(shoppingDate || date);
  const targetBudget = Number(expectedBudget || budget || 0);

  const assignMemberIds: string[] = Array.isArray(memberIds)
    ? memberIds
    : memberId
    ? [memberId]
    : [];

  const task = await prisma.$transaction(async (tx) => {
    const createdTask = await tx.bazaarTask.create({
      data: {
        messId,
        title,
        shoppingDate: sDate,
        expectedBudget: targetBudget,
        priority: priority || "MEDIUM",
        description,
        notes,
        createdById: req.user!.id,
        status: assignMemberIds.length > 0 ? "ASSIGNED" : "DRAFT",
      },
    });

    if (assignMemberIds.length > 0) {
      await tx.bazaarAssignee.createMany({
        data: assignMemberIds.map((mId) => ({
          taskId: createdTask.id,
          memberId: mId,
          assignedById: req.user!.id,
        })),
      });

      // Also set legacy 1:1 assignment for backwards compatibility
      await tx.bazaarAssignment.create({
        data: {
          taskId: createdTask.id,
          memberId: assignMemberIds[0],
          assignedById: req.user!.id,
          expectedCompletionDate: sDate,
        },
      });
    }

    if (Array.isArray(items) && items.length > 0) {
      await tx.bazaarItem.createMany({
        data: items.map((it: any, idx: number) => ({
          taskId: createdTask.id,
          name: it.name,
          quantity: Number(it.quantity || 1),
          unit: it.unit || "kg",
          estimatedPrice: it.estimatedPrice ? Number(it.estimatedPrice) : null,
          sortOrder: idx,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        messId,
        userId: req.user!.id,
        action: "CREATE",
        entity: "BazaarTask",
        entityId: createdTask.id,
        newData: JSON.stringify({ title, assignees: assignMemberIds }),
      },
    });

    return createdTask;
  });

  return sendSuccess(res, task, "Bazaar task created", 201);
}

export async function submitBazaar(req: Request, res: Response) {
  const { taskId } = req.params;
  const task = await prisma.bazaarTask.findUnique({
    where: { id: taskId },
    include: { assignees: true, assignment: true },
  });
  if (!task || task.deletedAt) throw new NotFoundError("Bazaar task not found");

  const access = await requireMessAccess(req.user!, task.messId, "BAZAAR_MANAGE");

  const { totalAmount, actualCost, notes, paymentSource, paidByMemberId, items } = req.body;
  const finalCost = Number(totalAmount || actualCost || 0);
  if (!finalCost || finalCost <= 0) throw new ValidationError("Actual cost must be greater than 0");

  const pSource = paymentSource === "MESS_BALANCE" ? "MESS_BALANCE" : "PERSONAL";

  // Determine who paid
  let finalPaidByMemberId = paidByMemberId;
  if (!finalPaidByMemberId && access.member) {
    finalPaidByMemberId = access.member.id;
  } else if (!finalPaidByMemberId && task.assignees.length > 0) {
    finalPaidByMemberId = task.assignees[0].memberId;
  }

  const submission = await prisma.$transaction(async (tx) => {
    const sub = await tx.bazaarSubmission.upsert({
      where: { taskId },
      create: {
        taskId,
        submittedById: req.user!.id,
        actualCost: finalCost,
        notes,
      },
      update: {
        submittedById: req.user!.id,
        actualCost: finalCost,
        notes,
      },
    });

    await tx.bazaarTask.update({
      where: { id: taskId },
      data: {
        status: "PENDING_REVIEW",
        paymentSource: pSource,
        paidByMemberId: pSource === "PERSONAL" ? finalPaidByMemberId : null,
      },
    });

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item.id) {
          await tx.bazaarItem.update({
            where: { id: item.id },
            data: {
              actualPrice: item.actualPrice ? Number(item.actualPrice) : null,
              status: item.status || "PURCHASED",
            },
          });
        }
      }
    }

    await tx.auditLog.create({
      data: {
        messId: task.messId,
        userId: req.user!.id,
        action: "UPDATE",
        entity: "BazaarSubmission",
        entityId: taskId,
        newData: JSON.stringify({ actualCost: finalCost, paymentSource: pSource }),
      },
    });

    return sub;
  });

  return sendSuccess(res, submission, "Bazaar submitted for review");
}

export async function approveBazaar(req: Request, res: Response) {
  const { taskId } = req.params;
  const task = await prisma.bazaarTask.findUnique({
    where: { id: taskId },
    include: {
      submission: true,
      assignees: true,
      paidBy: true,
      mess: { include: { currentMonth: true } },
    },
  });
  if (!task || task.deletedAt) throw new NotFoundError("Bazaar task not found");
  if (!task.submission) throw new ValidationError("Bazaar task has no submission to approve");

  await requireMessAccess(req.user!, task.messId, "BAZAAR_MANAGE");

  const targetMonthId = task.mess.currentMonthId;

  await prisma.$transaction(async (tx) => {
    // 1. Create or link to Grocery/Bazaar Expense
    let category = await tx.expenseCategory.findFirst({
      where: { messId: task.messId, isMealCost: true, deletedAt: null },
    });
    if (!category) {
      category = await tx.expenseCategory.findFirst({
        where: { messId: task.messId, deletedAt: null },
      });
    }

    const expense = await tx.expense.create({
      data: {
        messId: task.messId,
        monthId: targetMonthId,
        categoryId: category!.id,
        amount: task.submission!.actualCost,
        description: `Bazaar: ${task.title}`,
        date: task.shoppingDate,
        status: "APPROVED",
        createdById: req.user!.id,
        approvedById: req.user!.id,
        approvedAt: new Date(),
      },
    });

    await tx.bazaarTask.update({
      where: { id: taskId },
      data: {
        status: "APPROVED",
        expenseId: expense.id,
      },
    });

    await tx.bazaarApproval.create({
      data: {
        taskId,
        reviewedById: req.user!.id,
        status: "APPROVED",
        comment: req.body.comment || "Approved",
      },
    });

    // 2. Financial Ledger Entry
    if (task.paymentSource === "PERSONAL" && task.paidByMemberId) {
      // Personal payment: shopper is credited with a deposit-like adjustment
      await tx.financialTransaction.create({
        data: {
          messId: task.messId,
          monthId: targetMonthId,
          type: "BAZAAR_PERSONAL_CREDIT",
          amount: task.submission!.actualCost,
          memberId: task.paidByMemberId,
          createdById: req.user!.id,
          referenceId: task.id,
          referenceType: "BazaarTask",
          description: `Personal payment for bazaar: ${task.title}`,
        },
      });

      // Add Deposit credit to shopper
      await tx.deposit.create({
        data: {
          messId: task.messId,
          monthId: targetMonthId,
          memberId: task.paidByMemberId,
          amount: task.submission!.actualCost,
          method: "CASH",
          type: "MONTHLY",
          notes: `Bazaar Shopper Credit — ${task.title}`,
          status: "APPROVED",
          createdById: req.user!.id,
          approvedById: req.user!.id,
          approvedAt: new Date(),
        },
      });
    } else {
      // Mess Balance payment: mess balance is deducted
      await tx.financialTransaction.create({
        data: {
          messId: task.messId,
          monthId: targetMonthId,
          type: "BAZAAR_COST",
          amount: task.submission!.actualCost,
          createdById: req.user!.id,
          referenceId: task.id,
          referenceType: "BazaarTask",
          description: `Bazaar expense from mess balance: ${task.title}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        messId: task.messId,
        userId: req.user!.id,
        action: "APPROVE",
        entity: "BazaarTask",
        entityId: taskId,
        newData: JSON.stringify({ cost: task.submission!.actualCost, paymentSource: task.paymentSource }),
      },
    });
  });

  if (targetMonthId) {
    await recalculateMonth(task.messId, targetMonthId);
  }

  return sendSuccess(res, null, "Bazaar approved and financial records updated");
}

export async function rejectBazaar(req: Request, res: Response) {
  const { taskId } = req.params;
  const task = await prisma.bazaarTask.findUnique({ where: { id: taskId } });
  if (!task || task.deletedAt) throw new NotFoundError("Bazaar task not found");

  await requireMessAccess(req.user!, task.messId, "BAZAAR_MANAGE");

  await prisma.$transaction(async (tx) => {
    await tx.bazaarTask.update({
      where: { id: taskId },
      data: { status: "REJECTED" },
    });

    await tx.bazaarApproval.create({
      data: {
        taskId,
        reviewedById: req.user!.id,
        status: "REJECTED",
        comment: req.body.comment || "Rejected",
      },
    });

    await tx.auditLog.create({
      data: {
        messId: task.messId,
        userId: req.user!.id,
        action: "REJECT",
        entity: "BazaarTask",
        entityId: taskId,
        newData: JSON.stringify({ comment: req.body.comment }),
      },
    });
  });

  return sendSuccess(res, null, "Bazaar rejected");
}

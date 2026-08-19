"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMessAccess, ForbiddenError } from "@/lib/mess-access";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { assertMessWriteAccess } from "@/lib/billing/subscription-access";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { recalculateMonth } from "@/actions/monthly";
import { createUserNotification } from "@/lib/notifications";
import { saveBazaarFiles } from "@/lib/bazaar-upload";
import { isMissingBazaarTable, EMPTY_BAZAAR_ANALYTICS } from "@/lib/bazaar-db";
import { bazaarTaskSchema, bazaarReviewSchema } from "@/lib/validations";
import type { BazaarTaskStatus, BazaarItemStatus } from "@prisma/client";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function revalidateBazaar(messId: string) {
  revalidatePath(`/mess/${messId}`);
  revalidatePath(`/mess/${messId}/bazaar`);
  revalidatePath(`/mess/${messId}/bazaar/assigned`);
  revalidatePath(`/mess/${messId}/bazaar/history`);
  revalidatePath(`/mess/${messId}/bazaar/reports`);
  revalidatePath(`/mess/${messId}/bazaar/my`);
  revalidatePath(`/mess/${messId}/bazaar/tasks`, "layout");
}

async function logBazaarHistory(
  taskId: string,
  messId: string,
  action: string,
  performedById: string,
  opts?: { budget?: number; actualCost?: number; metadata?: Record<string, unknown> }
) {
  await db.bazaarHistory.create({
    data: {
      taskId,
      messId,
      action,
      performedById,
      budget: opts?.budget,
      actualCost: opts?.actualCost,
      metadata: opts?.metadata ? JSON.stringify(opts.metadata) : undefined,
    },
  });
}

async function findBazaarCategory(messId: string) {
  let category = await db.expenseCategory.findFirst({
    where: {
      messId,
      deletedAt: null,
      name: { in: ["Bazaar", "Grocery", "Grocery & Bazaar"] },
    },
  });
  if (!category) {
    category = await db.expenseCategory.findFirst({
      where: { messId, deletedAt: null },
    });
  }
  return category;
}

function canViewBazaarAdmin(access: Awaited<ReturnType<typeof requireMessAccess>>) {
  return (
    hasPermission(access.role, PERMISSIONS.BAZAAR_MANAGE) ||
    access.mess.ownerId === access.user.id
  );
}

export async function createBazaarTask(
  messId: string,
  formData: FormData
): Promise<ActionResult<{ taskId: string }>> {
  try {
    const { user } = await requireMessAccess(messId, "BAZAAR_MANAGE");
    await assertMessWriteAccess(messId);

    const itemsRaw = formData.get("items");
    let items: { name: string; quantity: number; unit: string; estimatedPrice?: number }[] = [];
    try {
      items = JSON.parse(String(itemsRaw ?? "[]"));
    } catch {
      return { success: false, error: "Invalid shopping items" };
    }

    const parsed = bazaarTaskSchema.safeParse({
      title: formData.get("title"),
      shoppingDate: formData.get("shoppingDate"),
      expectedBudget: formData.get("expectedBudget"),
      priority: formData.get("priority") || "MEDIUM",
      description: formData.get("description") || undefined,
      notes: formData.get("notes") || undefined,
      memberId: formData.get("memberId"),
      assignmentDate: formData.get("assignmentDate"),
      expectedCompletionDate: formData.get("expectedCompletionDate"),
      items,
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const member = await db.member.findFirst({
      where: { id: parsed.data.memberId, messId, status: "ACTIVE", deletedAt: null },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!member) return { success: false, error: "Selected member not found" };

    const task = await db.$transaction(async (tx) => {
      const created = await tx.bazaarTask.create({
        data: {
          messId,
          title: parsed.data.title,
          shoppingDate: new Date(parsed.data.shoppingDate),
          expectedBudget: parsed.data.expectedBudget,
          priority: parsed.data.priority,
          description: parsed.data.description,
          notes: parsed.data.notes,
          status: "ASSIGNED",
          createdById: user.id,
          items: {
            create: parsed.data.items.map((item, i) => ({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              estimatedPrice: item.estimatedPrice,
              sortOrder: i,
            })),
          },
        },
      });

      await tx.bazaarAssignment.create({
        data: {
          taskId: created.id,
          memberId: member.id,
          assignedById: user.id,
          assignmentDate: new Date(parsed.data.assignmentDate),
          expectedCompletionDate: new Date(parsed.data.expectedCompletionDate),
        },
      });

      await tx.bazaarHistory.create({
        data: {
          taskId: created.id,
          messId,
          action: "ASSIGNED",
          performedById: user.id,
          budget: parsed.data.expectedBudget,
          metadata: JSON.stringify({ memberId: member.id, memberName: member.fullName }),
        },
      });

      await tx.auditLog.create({
        data: {
          messId,
          userId: user.id,
          action: "CREATE",
          entity: "BazaarTask",
          entityId: created.id,
          newData: JSON.stringify({ title: parsed.data.title, memberId: member.id }),
        },
      });

      return created;
    });

    await createUserNotification(
      member.user.id,
      "BAZAAR_ASSIGNED",
      "New bazaar assignment",
      `You have been assigned: ${parsed.data.title}`,
      { messId, taskId: task.id }
    );

    revalidateBazaar(messId);
    return { success: true, data: { taskId: task.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create bazaar task" };
  }
}

export async function getBazaarTasks(
  messId: string,
  filter?: "all" | "assigned" | "pending_review" | "history"
) {
  const access = await requireMessAccess(messId);
  if (!canViewBazaarAdmin(access)) throw new ForbiddenError();

  const statusFilter: BazaarTaskStatus[] | undefined =
    filter === "assigned"
      ? ["ASSIGNED", "IN_PROGRESS", "CORRECTION_REQUESTED"]
      : filter === "pending_review"
        ? ["PENDING_REVIEW"]
        : filter === "history"
          ? ["APPROVED", "REJECTED", "CANCELLED"]
          : undefined;

  try {
    return await db.bazaarTask.findMany({
      where: {
        messId,
        deletedAt: null,
        ...(statusFilter ? { status: { in: statusFilter } } : {}),
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        assignment: {
          include: {
            member: { select: { id: true, fullName: true } },
            assignedBy: { select: { id: true, name: true } },
          },
        },
        submission: true,
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { shoppingDate: "desc" },
    });
  } catch (error) {
    if (isMissingBazaarTable(error)) return [];
    throw error;
  }
}

export async function getBazaarTask(messId: string, taskId: string) {
  const access = await requireMessAccess(messId);
  try {
    const task = await db.bazaarTask.findFirst({
      where: { id: taskId, messId, deletedAt: null },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        assignment: {
          include: {
            member: { select: { id: true, fullName: true, userId: true } },
            assignedBy: { select: { id: true, name: true } },
          },
        },
        submission: { include: { receipts: true } },
        receipts: true,
        approvals: {
          include: { reviewedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        history: { orderBy: { createdAt: "desc" }, take: 20 },
        createdBy: { select: { name: true } },
        expense: { select: { id: true, amount: true } },
      },
    });
    if (!task) return null;
    const isAssignee = task.assignment?.memberId === access.member?.id;
    if (!canViewBazaarAdmin(access) && !isAssignee) throw new ForbiddenError();
    return task;
  } catch (error) {
    if (isMissingBazaarTable(error)) return null;
    throw error;
  }
}

export async function getMyPendingBazaars(messId: string, memberId: string) {
  const access = await requireMessAccess(messId);
  if (!access.member || access.member.id !== memberId) throw new ForbiddenError();
  try {
    return await db.bazaarTask.findMany({
      where: {
        messId,
        deletedAt: null,
        status: { in: ["ASSIGNED", "IN_PROGRESS", "CORRECTION_REQUESTED"] },
        assignment: { memberId },
      },
      include: {
        assignment: {
          include: {
            member: { select: { fullName: true } },
            assignedBy: { select: { name: true } },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { shoppingDate: "asc" },
    });
  } catch (error) {
    if (isMissingBazaarTable(error)) return [];
    throw error;
  }
}

export async function submitBazaarTask(
  messId: string,
  taskId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user, member } = await requireMessAccess(messId);
    await assertMessWriteAccess(messId);
    if (!member) return { success: false, error: "Not a member of this mess" };

    const task = await db.bazaarTask.findFirst({
      where: { id: taskId, messId, deletedAt: null },
      include: { assignment: true, items: true },
    });
    if (!task) return { success: false, error: "Task not found" };
    if (task.assignment?.memberId !== member.id) {
      return { success: false, error: "You are not assigned to this bazaar task" };
    }
    if (!["ASSIGNED", "IN_PROGRESS", "CORRECTION_REQUESTED"].includes(task.status)) {
      return { success: false, error: "This task cannot be submitted" };
    }

    const actualCost = Number(formData.get("actualCost"));
    if (!actualCost || actualCost < 0) {
      return { success: false, error: "Valid actual cost is required" };
    }

    const notes = String(formData.get("notes") ?? "").trim() || null;
    const missingItems = String(formData.get("missingItems") ?? "").trim() || null;

    let itemUpdates: { id: string; status: BazaarItemStatus; actualPrice?: number; notes?: string }[] = [];
    try {
      itemUpdates = JSON.parse(String(formData.get("itemUpdates") ?? "[]"));
    } catch {
      return { success: false, error: "Invalid item updates" };
    }

    const files = formData.getAll("receipts").filter((f) => f instanceof File && f.size > 0) as File[];
    const receiptUrls = await saveBazaarFiles(files);

    const manager = await db.mess.findUnique({
      where: { id: messId },
      select: { managerId: true },
    });

    await db.$transaction(async (tx) => {
      const submission = await tx.bazaarSubmission.upsert({
        where: { taskId },
        create: {
          taskId,
          submittedById: user.id,
          actualCost,
          notes,
          missingItems,
          itemUpdates: JSON.stringify(itemUpdates),
        },
        update: {
          actualCost,
          notes,
          missingItems,
          itemUpdates: JSON.stringify(itemUpdates),
          submittedAt: new Date(),
        },
      });

      for (const update of itemUpdates) {
        await tx.bazaarItem.updateMany({
          where: { id: update.id, taskId },
          data: {
            status: update.status,
            actualPrice: update.actualPrice,
            notes: update.notes,
          },
        });
      }

      for (const url of receiptUrls) {
        const ext = url.split(".").pop()?.toLowerCase();
        await tx.bazaarReceipt.create({
          data: {
            taskId,
            submissionId: submission.id,
            fileUrl: url,
            fileType: ext === "pdf" ? "application/pdf" : "image",
            uploadedById: user.id,
          },
        });
      }

      await tx.bazaarTask.update({
        where: { id: taskId },
        data: { status: "PENDING_REVIEW" },
      });

      await tx.bazaarHistory.create({
        data: {
          taskId,
          messId,
          action: "SUBMITTED",
          performedById: user.id,
          budget: task.expectedBudget,
          actualCost,
        },
      });
    });

    if (manager?.managerId) {
      await createUserNotification(
        manager.managerId,
        "BAZAAR_SUBMITTED",
        "Bazaar submitted for review",
        `${task.title} — ${actualCost} BDT`,
        { messId, taskId }
      );
    }

    if (actualCost > task.expectedBudget) {
      if (manager?.managerId) {
        await createUserNotification(
          manager.managerId,
          "BAZAAR_BUDGET_EXCEEDED",
          "Bazaar budget exceeded",
          `${task.title}: budget ${task.expectedBudget}, actual ${actualCost} BDT`,
          { messId, taskId }
        );
      }
    }

    revalidateBazaar(messId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Submission failed" };
  }
}

export async function reviewBazaarTask(
  messId: string,
  taskId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user } = await requireMessAccess(messId, "BAZAAR_MANAGE");
    await assertMessWriteAccess(messId);

    const parsed = bazaarReviewSchema.safeParse({
      status: formData.get("status"),
      comment: formData.get("comment") || undefined,
      rewardPoints: formData.get("rewardPoints") || 0,
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const task = await db.bazaarTask.findFirst({
      where: { id: taskId, messId, deletedAt: null, status: "PENDING_REVIEW" },
      include: {
        submission: true,
        assignment: { include: { member: { include: { user: true } } } },
        items: true,
      },
    });
    if (!task || !task.submission) {
      return { success: false, error: "No pending submission found" };
    }

    const taskStatus =
      parsed.data.status === "APPROVED"
        ? "APPROVED"
        : parsed.data.status === "REJECTED"
          ? "REJECTED"
          : "CORRECTION_REQUESTED";

    let rewardPoints = parsed.data.rewardPoints ?? 0;

    if (parsed.data.status === "APPROVED") {
      const dueDate = task.assignment?.expectedCompletionDate;
      const onTime = dueDate ? new Date() <= dueDate : true;
      const underBudget = task.submission.actualCost <= task.expectedBudget;

      if (rewardPoints === 0) {
        rewardPoints = 10;
        if (onTime) rewardPoints += 5;
        if (underBudget) rewardPoints += 5;
      }
    }

    await db.$transaction(async (tx) => {
      await tx.bazaarApproval.create({
        data: {
          taskId,
          reviewedById: user.id,
          status: parsed.data.status,
          comment: parsed.data.comment,
        },
      });

      if (parsed.data.status === "APPROVED") {
        const month = await ensureCurrentMonth(messId);
        const category = await findBazaarCategory(messId);
        if (!category) throw new Error("No expense category found");

        const itemNames = task.items.map((i) => `${i.name} ${i.quantity}${i.unit}`).join(", ");
        const expense = await tx.expense.create({
          data: {
            messId,
            monthId: month.id,
            categoryId: category.id,
            amount: task.submission!.actualCost,
            description: `Bazaar: ${task.title} — ${itemNames.slice(0, 200)}`,
            date: task.shoppingDate,
            status: "APPROVED",
            createdById: user.id,
            approvedById: user.id,
            approvedAt: new Date(),
          },
        });

        await tx.bazaarEntry.create({
          data: {
            messId,
            items: JSON.stringify(task.items.map((i) => `${i.name} - ${i.quantity} ${i.unit}`)),
            totalAmount: task.submission!.actualCost,
            date: task.shoppingDate,
            notes: `Bazaar task ${task.id}`,
            receiptUrl: task.submission!.id,
          },
        });

        await tx.bazaarTask.update({
          where: { id: taskId },
          data: {
            status: "APPROVED",
            expenseId: expense.id,
            rewardPoints,
          },
        });

        if (rewardPoints > 0 && task.assignment?.memberId) {
          await tx.bazaarMemberPoints.create({
            data: {
              messId,
              memberId: task.assignment.memberId,
              points: rewardPoints,
              reason: `Completed bazaar: ${task.title}`,
              taskId,
            },
          });
        }
      } else {
        await tx.bazaarTask.update({
          where: { id: taskId },
          data: { status: taskStatus },
        });

        if (parsed.data.status === "REJECTED" && task.assignment?.memberId) {
          await tx.bazaarMemberPoints.create({
            data: {
              messId,
              memberId: task.assignment.memberId,
              points: -5,
              reason: `Late/rejected bazaar: ${task.title}`,
              taskId,
            },
          });
        }
      }

      await tx.bazaarHistory.create({
        data: {
          taskId,
          messId,
          action: parsed.data.status,
          performedById: user.id,
          budget: task.expectedBudget,
          actualCost: task.submission!.actualCost,
          metadata: JSON.stringify({ comment: parsed.data.comment, rewardPoints }),
        },
      });

      await tx.auditLog.create({
        data: {
          messId,
          userId: user.id,
          action: parsed.data.status === "APPROVED" ? "APPROVE" : "REJECT",
          entity: "BazaarTask",
          entityId: taskId,
          newData: JSON.stringify({ status: taskStatus, actualCost: task.submission!.actualCost }),
        },
      });
    });

    if (parsed.data.status === "APPROVED") {
      const month = await ensureCurrentMonth(messId);
      await recalculateMonth(messId, month.id);
    }

    const assigneeUserId = task.assignment?.member.userId;
    if (assigneeUserId) {
      const notifType =
        parsed.data.status === "APPROVED"
          ? "BAZAAR_APPROVED"
          : parsed.data.status === "REJECTED"
            ? "BAZAAR_REJECTED"
            : "BAZAAR_SUBMITTED";
      const title =
        parsed.data.status === "APPROVED"
          ? "Bazaar approved"
          : parsed.data.status === "REJECTED"
            ? "Bazaar rejected"
            : "Correction requested";
      await createUserNotification(assigneeUserId, notifType, title, task.title, {
        messId,
        taskId,
      });
    }

    revalidateBazaar(messId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Review failed" };
  }
}

export async function getBazaarAnalytics(messId: string) {
  const access = await requireMessAccess(messId);
  if (!canViewBazaarAdmin(access)) throw new ForbiddenError();
  try {
    const tasks = await db.bazaarTask.findMany({
      where: { messId, deletedAt: null, status: "APPROVED" },
      include: {
        assignment: { include: { member: { select: { id: true, fullName: true } } } },
        submission: true,
      },
    });

    const totalCost = tasks.reduce((s, t) => s + (t.submission?.actualCost ?? 0), 0);
  const totalBudget = tasks.reduce((s, t) => s + t.expectedBudget, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyTasks = tasks.filter((t) => t.shoppingDate >= monthStart);
  const monthlyCost = monthlyTasks.reduce((s, t) => s + (t.submission?.actualCost ?? 0), 0);

  const memberMap = new Map<string, { name: string; cost: number; count: number }>();
  for (const t of tasks) {
    const m = t.assignment?.member;
    if (!m) continue;
    const cur = memberMap.get(m.id) ?? { name: m.fullName ?? "Member", cost: 0, count: 0 };
    cur.cost += t.submission?.actualCost ?? 0;
    cur.count += 1;
    memberMap.set(m.id, cur);
  }

  const memberWise = Array.from(memberMap.entries())
    .map(([id, v]) => ({ memberId: id, ...v }))
    .sort((a, b) => b.cost - a.cost);

  const mostActive = memberWise.sort((a, b) => b.count - a.count)[0] ?? null;
  const avgCost = tasks.length ? totalCost / tasks.length : 0;

  const monthlyTrend: { month: string; budget: number; actual: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const label = d.toLocaleString("en", { month: "short" });
    const monthTasks = tasks.filter((t) => t.shoppingDate >= d && t.shoppingDate <= end);
    monthlyTrend.push({
      month: label,
      budget: monthTasks.reduce((s, t) => s + t.expectedBudget, 0),
      actual: monthTasks.reduce((s, t) => s + (t.submission?.actualCost ?? 0), 0),
    });
  }

    return {
      totalCost,
      totalBudget,
      monthlyCost,
      avgCost,
      taskCount: tasks.length,
      memberWise,
      mostActiveShopper: mostActive,
      monthlyTrend,
      budgetVariance: totalBudget - totalCost,
    };
  } catch (error) {
    if (isMissingBazaarTable(error)) return EMPTY_BAZAAR_ANALYTICS;
    throw error;
  }
}

export async function getBazaarHistory(messId: string) {
  const access = await requireMessAccess(messId);
  if (!canViewBazaarAdmin(access)) throw new ForbiddenError();
  try {
    return await db.bazaarTask.findMany({
      where: {
        messId,
        deletedAt: null,
        status: { in: ["APPROVED", "REJECTED", "CANCELLED"] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        expectedBudget: true,
        updatedAt: true,
        assignment: {
          include: { member: { select: { fullName: true } } },
        },
        submission: { select: { actualCost: true, submittedAt: true } },
        approvals: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            createdAt: true,
            reviewedBy: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  } catch (error) {
    if (isMissingBazaarTable(error)) return [];
    throw error;
  }
}

export async function markBazaarInProgress(messId: string, taskId: string): Promise<ActionResult> {
  try {
    const { member } = await requireMessAccess(messId);
    await assertMessWriteAccess(messId);
    if (!member) return { success: false, error: "Not a member" };

    const task = await db.bazaarTask.findFirst({
      where: { id: taskId, messId, assignment: { memberId: member.id } },
    });
    if (!task) return { success: false, error: "Task not found" };

    await db.bazaarTask.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });

    revalidateBazaar(messId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

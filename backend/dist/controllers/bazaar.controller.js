"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBazaarTasks = getBazaarTasks;
exports.createBazaarTask = createBazaarTask;
exports.submitBazaar = submitBazaar;
exports.approveBazaar = approveBazaar;
exports.rejectBazaar = rejectBazaar;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const access_service_1 = require("../services/access.service");
const financial_service_1 = require("../services/financial.service");
async function getBazaarTasks(req, res) {
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "BAZAAR_MANAGE");
    const tasks = await database_1.prisma.bazaarTask.findMany({
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
    return (0, response_1.sendList)(res, tasks, { total: tasks.length });
}
async function createBazaarTask(req, res) {
    const messId = req.params.messId || req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "BAZAAR_MANAGE");
    const { title, shoppingDate, date, expectedBudget, budget, priority, description, notes, memberIds, memberId, items } = req.body;
    if (!title || (!shoppingDate && !date))
        throw new errors_1.ValidationError("Title and shopping date are required");
    const sDate = new Date(shoppingDate || date);
    const targetBudget = Number(expectedBudget || budget || 0);
    const assignMemberIds = Array.isArray(memberIds)
        ? memberIds
        : memberId
            ? [memberId]
            : [];
    const task = await database_1.prisma.$transaction(async (tx) => {
        const createdTask = await tx.bazaarTask.create({
            data: {
                messId,
                title,
                shoppingDate: sDate,
                expectedBudget: targetBudget,
                priority: priority || "MEDIUM",
                description,
                notes,
                createdById: req.user.id,
                status: assignMemberIds.length > 0 ? "ASSIGNED" : "DRAFT",
            },
        });
        if (assignMemberIds.length > 0) {
            await tx.bazaarAssignee.createMany({
                data: assignMemberIds.map((mId) => ({
                    taskId: createdTask.id,
                    memberId: mId,
                    assignedById: req.user.id,
                })),
            });
            // Also set legacy 1:1 assignment for backwards compatibility
            await tx.bazaarAssignment.create({
                data: {
                    taskId: createdTask.id,
                    memberId: assignMemberIds[0],
                    assignedById: req.user.id,
                    expectedCompletionDate: sDate,
                },
            });
        }
        if (Array.isArray(items) && items.length > 0) {
            await tx.bazaarItem.createMany({
                data: items.map((it, idx) => ({
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
                userId: req.user.id,
                action: "CREATE",
                entity: "BazaarTask",
                entityId: createdTask.id,
                newData: JSON.stringify({ title, assignees: assignMemberIds }),
            },
        });
        return createdTask;
    });
    return (0, response_1.sendSuccess)(res, task, "Bazaar task created", 201);
}
async function submitBazaar(req, res) {
    const { taskId } = req.params;
    const task = await database_1.prisma.bazaarTask.findUnique({
        where: { id: taskId },
        include: { assignees: true, assignment: true },
    });
    if (!task || task.deletedAt)
        throw new errors_1.NotFoundError("Bazaar task not found");
    const access = await (0, access_service_1.requireMessAccess)(req.user, task.messId, "BAZAAR_MANAGE");
    const { totalAmount, actualCost, notes, paymentSource, paidByMemberId, items } = req.body;
    const finalCost = Number(totalAmount || actualCost || 0);
    if (!finalCost || finalCost <= 0)
        throw new errors_1.ValidationError("Actual cost must be greater than 0");
    const pSource = paymentSource === "MESS_BALANCE" ? "MESS_BALANCE" : "PERSONAL";
    // Determine who paid
    let finalPaidByMemberId = paidByMemberId;
    if (!finalPaidByMemberId && access.member) {
        finalPaidByMemberId = access.member.id;
    }
    else if (!finalPaidByMemberId && task.assignees.length > 0) {
        finalPaidByMemberId = task.assignees[0].memberId;
    }
    const submission = await database_1.prisma.$transaction(async (tx) => {
        const sub = await tx.bazaarSubmission.upsert({
            where: { taskId },
            create: {
                taskId,
                submittedById: req.user.id,
                actualCost: finalCost,
                notes,
            },
            update: {
                submittedById: req.user.id,
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
                userId: req.user.id,
                action: "UPDATE",
                entity: "BazaarSubmission",
                entityId: taskId,
                newData: JSON.stringify({ actualCost: finalCost, paymentSource: pSource }),
            },
        });
        return sub;
    });
    return (0, response_1.sendSuccess)(res, submission, "Bazaar submitted for review");
}
async function approveBazaar(req, res) {
    const { taskId } = req.params;
    const task = await database_1.prisma.bazaarTask.findUnique({
        where: { id: taskId },
        include: {
            submission: true,
            assignees: true,
            paidBy: true,
            mess: { include: { currentMonth: true } },
        },
    });
    if (!task || task.deletedAt)
        throw new errors_1.NotFoundError("Bazaar task not found");
    if (!task.submission)
        throw new errors_1.ValidationError("Bazaar task has no submission to approve");
    await (0, access_service_1.requireMessAccess)(req.user, task.messId, "BAZAAR_MANAGE");
    const targetMonthId = task.mess.currentMonthId;
    await database_1.prisma.$transaction(async (tx) => {
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
                categoryId: category.id,
                amount: task.submission.actualCost,
                description: `Bazaar: ${task.title}`,
                date: task.shoppingDate,
                status: "APPROVED",
                createdById: req.user.id,
                approvedById: req.user.id,
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
                reviewedById: req.user.id,
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
                    amount: task.submission.actualCost,
                    memberId: task.paidByMemberId,
                    createdById: req.user.id,
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
                    amount: task.submission.actualCost,
                    method: "CASH",
                    type: "MONTHLY",
                    notes: `Bazaar Shopper Credit — ${task.title}`,
                    status: "APPROVED",
                    createdById: req.user.id,
                    approvedById: req.user.id,
                    approvedAt: new Date(),
                },
            });
        }
        else {
            // Mess Balance payment: mess balance is deducted
            await tx.financialTransaction.create({
                data: {
                    messId: task.messId,
                    monthId: targetMonthId,
                    type: "BAZAAR_COST",
                    amount: task.submission.actualCost,
                    createdById: req.user.id,
                    referenceId: task.id,
                    referenceType: "BazaarTask",
                    description: `Bazaar expense from mess balance: ${task.title}`,
                },
            });
        }
        await tx.auditLog.create({
            data: {
                messId: task.messId,
                userId: req.user.id,
                action: "APPROVE",
                entity: "BazaarTask",
                entityId: taskId,
                newData: JSON.stringify({ cost: task.submission.actualCost, paymentSource: task.paymentSource }),
            },
        });
    });
    if (targetMonthId) {
        await (0, financial_service_1.recalculateMonth)(task.messId, targetMonthId);
    }
    return (0, response_1.sendSuccess)(res, null, "Bazaar approved and financial records updated");
}
async function rejectBazaar(req, res) {
    const { taskId } = req.params;
    const task = await database_1.prisma.bazaarTask.findUnique({ where: { id: taskId } });
    if (!task || task.deletedAt)
        throw new errors_1.NotFoundError("Bazaar task not found");
    await (0, access_service_1.requireMessAccess)(req.user, task.messId, "BAZAAR_MANAGE");
    await database_1.prisma.$transaction(async (tx) => {
        await tx.bazaarTask.update({
            where: { id: taskId },
            data: { status: "REJECTED" },
        });
        await tx.bazaarApproval.create({
            data: {
                taskId,
                reviewedById: req.user.id,
                status: "REJECTED",
                comment: req.body.comment || "Rejected",
            },
        });
        await tx.auditLog.create({
            data: {
                messId: task.messId,
                userId: req.user.id,
                action: "REJECT",
                entity: "BazaarTask",
                entityId: taskId,
                newData: JSON.stringify({ comment: req.body.comment }),
            },
        });
    });
    return (0, response_1.sendSuccess)(res, null, "Bazaar rejected");
}
//# sourceMappingURL=bazaar.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBazaarTasks = getBazaarTasks;
exports.createBazaarTask = createBazaarTask;
exports.submitBazaar = submitBazaar;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getBazaarTasks(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const tasks = await database_1.prisma.bazaarTask.findMany({
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
    return (0, response_1.sendList)(res, tasks, { total: tasks.length });
}
async function createBazaarTask(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { title, date, budget, notes, assignedMemberId } = req.body;
    if (!title || !date)
        throw new errors_1.ValidationError("Title and date are required");
    const task = await database_1.prisma.bazaarTask.create({
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
    return (0, response_1.sendSuccess)(res, task, "Bazaar task created", 201);
}
async function submitBazaar(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { taskId } = req.params;
    const { totalAmount, notes } = req.body;
    const submission = await database_1.prisma.bazaarSubmission.create({
        data: {
            taskId,
            submittedById: req.user.id,
            actualCost: Number(totalAmount || 0),
            notes,
        },
    });
    await database_1.prisma.bazaarTask.update({
        where: { id: taskId },
        data: { status: "PENDING_REVIEW" },
    });
    return (0, response_1.sendSuccess)(res, submission, "Bazaar submitted for review");
}
//# sourceMappingURL=bazaar.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeposits = getDeposits;
exports.createDeposit = createDeposit;
exports.updateDeposit = updateDeposit;
exports.deleteDeposit = deleteDeposit;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const access_service_1 = require("../services/access.service");
const financial_service_1 = require("../services/financial.service");
async function getDeposits(req, res) {
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "DEPOSIT_READ");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const monthId = req.query.monthId;
    const where = { messId, deletedAt: null };
    if (monthId)
        where.monthId = monthId;
    const [deposits, total] = await Promise.all([
        database_1.prisma.deposit.findMany({
            where,
            include: {
                member: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
                createdBy: { select: { id: true, name: true } },
                approvedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        database_1.prisma.deposit.count({ where }),
    ]);
    return (0, response_1.sendList)(res, deposits, { page, limit, total });
}
async function createDeposit(req, res) {
    const messId = req.params.messId || req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "DEPOSIT_CREATE");
    const { memberId, amount, method, type, reference, notes, monthId } = req.body;
    if (!memberId || !amount || !method) {
        throw new errors_1.ValidationError("Member, amount, and payment method are required");
    }
    const mess = await database_1.prisma.mess.findUnique({
        where: { id: messId },
        include: { currentMonth: true },
    });
    if (!mess)
        throw new errors_1.NotFoundError("Mess not found");
    const targetMonthId = monthId || mess.currentMonthId;
    const deposit = await database_1.prisma.$transaction(async (tx) => {
        const created = await tx.deposit.create({
            data: {
                messId,
                monthId: targetMonthId,
                memberId,
                amount: Number(amount),
                method: method,
                type: type || "MONTHLY",
                reference,
                notes,
                status: "APPROVED",
                createdById: req.user.id,
                approvedById: req.user.id,
                approvedAt: new Date(),
            },
            include: {
                member: { include: { user: { select: { name: true } } } },
            },
        });
        await tx.financialTransaction.create({
            data: {
                messId,
                monthId: targetMonthId,
                type: "DEPOSIT",
                amount: Number(amount),
                memberId,
                createdById: req.user.id,
                referenceId: created.id,
                referenceType: "Deposit",
                description: notes || `Deposit of ${amount} BDT by ${created.member.fullName || "Member"}`,
            },
        });
        await tx.auditLog.create({
            data: {
                messId,
                userId: req.user.id,
                action: "CREATE",
                entity: "Deposit",
                entityId: created.id,
                newData: JSON.stringify({ amount, method, memberId }),
            },
        });
        return created;
    });
    if (targetMonthId) {
        await (0, financial_service_1.recalculateMonth)(messId, targetMonthId);
    }
    return (0, response_1.sendSuccess)(res, deposit, "Deposit recorded successfully", 201);
}
async function updateDeposit(req, res) {
    const { id } = req.params;
    const deposit = await database_1.prisma.deposit.findUnique({ where: { id } });
    if (!deposit || deposit.deletedAt)
        throw new errors_1.NotFoundError("Deposit not found");
    await (0, access_service_1.requireMessAccess)(req.user, deposit.messId, "DEPOSIT_CREATE");
    const { amount, method, type, reference, notes, status } = req.body;
    const updated = await database_1.prisma.$transaction(async (tx) => {
        const u = await tx.deposit.update({
            where: { id },
            data: {
                ...(amount !== undefined && { amount: Number(amount) }),
                ...(method !== undefined && { method }),
                ...(type !== undefined && { type }),
                ...(reference !== undefined && { reference }),
                ...(notes !== undefined && { notes }),
                ...(status !== undefined && { status }),
            },
        });
        await tx.auditLog.create({
            data: {
                messId: deposit.messId,
                userId: req.user.id,
                action: "UPDATE",
                entity: "Deposit",
                entityId: id,
                newData: JSON.stringify(req.body),
            },
        });
        return u;
    });
    if (deposit.monthId) {
        await (0, financial_service_1.recalculateMonth)(deposit.messId, deposit.monthId);
    }
    return (0, response_1.sendSuccess)(res, updated, "Deposit updated successfully");
}
async function deleteDeposit(req, res) {
    const { id } = req.params;
    const deposit = await database_1.prisma.deposit.findUnique({ where: { id } });
    if (!deposit || deposit.deletedAt)
        throw new errors_1.NotFoundError("Deposit not found");
    await (0, access_service_1.requireMessAccess)(req.user, deposit.messId, "DEPOSIT_CREATE");
    await database_1.prisma.$transaction(async (tx) => {
        await tx.deposit.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await tx.auditLog.create({
            data: {
                messId: deposit.messId,
                userId: req.user.id,
                action: "DELETE",
                entity: "Deposit",
                entityId: id,
            },
        });
    });
    if (deposit.monthId) {
        await (0, financial_service_1.recalculateMonth)(deposit.messId, deposit.monthId);
    }
    return (0, response_1.sendSuccess)(res, null, "Deposit deleted successfully");
}
//# sourceMappingURL=deposit.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeposits = getDeposits;
exports.createDeposit = createDeposit;
exports.updateDepositStatus = updateDepositStatus;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getDeposits(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const [deposits, total] = await Promise.all([
        database_1.prisma.deposit.findMany({
            where: { messId, deletedAt: null },
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
        database_1.prisma.deposit.count({ where: { messId, deletedAt: null } }),
    ]);
    return (0, response_1.sendList)(res, deposits, { page, limit, total });
}
async function createDeposit(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { memberId, amount, method, reference, notes } = req.body;
    const targetMemberId = memberId || req.user.memberId;
    if (!targetMemberId || !amount || !method) {
        throw new errors_1.ValidationError("Member, amount, and payment method are required");
    }
    const deposit = await database_1.prisma.deposit.create({
        data: {
            messId,
            memberId: targetMemberId,
            amount: Number(amount),
            method: method,
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
    // Update member total deposit balance
    await database_1.prisma.member.update({
        where: { id: targetMemberId },
        data: { totalDeposit: { increment: Number(amount) } },
    });
    return (0, response_1.sendSuccess)(res, deposit, "Deposit submitted successfully", 201);
}
async function updateDepositStatus(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { id } = req.params;
    const { status } = req.body;
    const deposit = await database_1.prisma.deposit.update({
        where: { id },
        data: {
            status,
            approvedById: req.user.id,
            approvedAt: new Date(),
        },
    });
    return (0, response_1.sendSuccess)(res, deposit, `Deposit status updated to ${status}`);
}
//# sourceMappingURL=deposit.controller.js.map
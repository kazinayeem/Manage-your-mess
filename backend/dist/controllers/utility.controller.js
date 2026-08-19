"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBills = getBills;
exports.createBill = createBill;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getBills(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const bills = await database_1.prisma.bill.findMany({
        where: { messId, deletedAt: null },
        include: {
            createdBy: { select: { name: true } },
            memberShares: {
                include: { member: { include: { user: { select: { name: true } } } } },
            },
        },
        orderBy: { billingMonth: "desc" },
    });
    return (0, response_1.sendList)(res, bills, { total: bills.length });
}
async function createBill(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { category, amount, description, billingMonth, splitMethod } = req.body;
    if (!category || !amount)
        throw new errors_1.ValidationError("Category and amount required");
    const bill = await database_1.prisma.bill.create({
        data: {
            messId,
            category,
            amount: Number(amount),
            description,
            billingMonth: billingMonth ? new Date(billingMonth) : new Date(),
            splitMethod: splitMethod || "EQUAL",
            createdById: req.user.id,
            status: "PENDING",
        },
    });
    return (0, response_1.sendSuccess)(res, bill, "Utility bill created", 201);
}
//# sourceMappingURL=utility.controller.js.map
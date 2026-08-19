"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenses = getExpenses;
exports.getCategories = getCategories;
exports.createExpense = createExpense;
exports.approveExpense = approveExpense;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getExpenses(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = req.query.search;
    const where = { messId, deletedAt: null };
    if (search) {
        where.description = { contains: search, mode: "insensitive" };
    }
    const [expenses, total] = await Promise.all([
        database_1.prisma.expense.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, isMealCost: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true } },
            },
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        database_1.prisma.expense.count({ where }),
    ]);
    return (0, response_1.sendList)(res, expenses, { page, limit, total });
}
async function getCategories(req, res) {
    const messId = req.activeMessId || req.query.messId;
    const categories = await database_1.prisma.expenseCategory.findMany({
        where: {
            OR: [{ isDefault: true }, { messId }],
            deletedAt: null,
        },
    });
    return (0, response_1.sendList)(res, categories, { total: categories.length });
}
async function createExpense(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { categoryId, amount, description, date, receiptUrl } = req.body;
    if (!amount || !categoryId)
        throw new errors_1.ValidationError("Amount and category are required");
    const expense = await database_1.prisma.expense.create({
        data: {
            messId,
            categoryId,
            amount: Number(amount),
            description,
            receiptUrl,
            date: date ? new Date(date) : new Date(),
            createdById: req.user.id,
            status: "APPROVED", // Default auto-approve for managers or logged-in member creating expense
        },
        include: { category: true, createdBy: { select: { name: true } } },
    });
    return (0, response_1.sendSuccess)(res, expense, "Expense created successfully", 201);
}
async function approveExpense(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { id } = req.params;
    const expense = await database_1.prisma.expense.update({
        where: { id },
        data: {
            status: "APPROVED",
            approvedById: req.user.id,
            approvedAt: new Date(),
        },
    });
    return (0, response_1.sendSuccess)(res, expense, "Expense approved");
}
//# sourceMappingURL=expense.controller.js.map
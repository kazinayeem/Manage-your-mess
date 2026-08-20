"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenses = getExpenses;
exports.getCategories = getCategories;
exports.createExpense = createExpense;
exports.approveExpense = approveExpense;
exports.deleteExpense = deleteExpense;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const access_service_1 = require("../services/access.service");
const financial_service_1 = require("../services/financial.service");
async function getExpenses(req, res) {
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "EXPENSE_READ");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const search = req.query.search;
    const monthId = req.query.monthId;
    const where = { messId, deletedAt: null };
    if (monthId)
        where.monthId = monthId;
    if (search) {
        where.description = { contains: search };
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
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    const categories = await database_1.prisma.expenseCategory.findMany({
        where: {
            OR: [{ isDefault: true }, ...(messId ? [{ messId }] : [])],
            deletedAt: null,
        },
    });
    return (0, response_1.sendList)(res, categories, { total: categories.length });
}
async function createExpense(req, res) {
    const messId = req.params.messId || req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "EXPENSE_CREATE");
    const { categoryId, amount, description, date, receiptUrl, monthId } = req.body;
    if (!amount || !categoryId)
        throw new errors_1.ValidationError("Amount and category are required");
    const mess = await database_1.prisma.mess.findUnique({
        where: { id: messId },
        include: { currentMonth: true },
    });
    if (!mess)
        throw new errors_1.NotFoundError("Mess not found");
    const targetMonthId = monthId || mess.currentMonthId;
    const expense = await database_1.prisma.$transaction(async (tx) => {
        const created = await tx.expense.create({
            data: {
                messId,
                monthId: targetMonthId,
                categoryId,
                amount: Number(amount),
                description,
                receiptUrl,
                date: date ? new Date(date) : new Date(),
                createdById: req.user.id,
                status: "APPROVED",
                approvedById: req.user.id,
                approvedAt: new Date(),
            },
            include: { category: true, createdBy: { select: { name: true } } },
        });
        await tx.financialTransaction.create({
            data: {
                messId,
                monthId: targetMonthId,
                type: created.category.isMealCost ? "BAZAAR_COST" : "EXPENSE",
                amount: Number(amount),
                createdById: req.user.id,
                referenceId: created.id,
                referenceType: "Expense",
                description: description || `Expense for ${created.category.name}`,
            },
        });
        await tx.auditLog.create({
            data: {
                messId,
                userId: req.user.id,
                action: "CREATE",
                entity: "Expense",
                entityId: created.id,
                newData: JSON.stringify({ amount, categoryId, description }),
            },
        });
        return created;
    });
    if (targetMonthId) {
        await (0, financial_service_1.recalculateMonth)(messId, targetMonthId);
    }
    return (0, response_1.sendSuccess)(res, expense, "Expense created successfully", 201);
}
async function approveExpense(req, res) {
    const { id } = req.params;
    const expense = await database_1.prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.deletedAt)
        throw new errors_1.NotFoundError("Expense not found");
    await (0, access_service_1.requireMessAccess)(req.user, expense.messId, "EXPENSE_APPROVE");
    const updated = await database_1.prisma.expense.update({
        where: { id },
        data: {
            status: "APPROVED",
            approvedById: req.user.id,
            approvedAt: new Date(),
        },
    });
    if (expense.monthId) {
        await (0, financial_service_1.recalculateMonth)(expense.messId, expense.monthId);
    }
    return (0, response_1.sendSuccess)(res, updated, "Expense approved");
}
async function deleteExpense(req, res) {
    const { id } = req.params;
    const expense = await database_1.prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.deletedAt)
        throw new errors_1.NotFoundError("Expense not found");
    await (0, access_service_1.requireMessAccess)(req.user, expense.messId, "EXPENSE_DELETE");
    await database_1.prisma.$transaction(async (tx) => {
        await tx.expense.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await tx.auditLog.create({
            data: {
                messId: expense.messId,
                userId: req.user.id,
                action: "DELETE",
                entity: "Expense",
                entityId: id,
            },
        });
    });
    if (expense.monthId) {
        await (0, financial_service_1.recalculateMonth)(expense.messId, expense.monthId);
    }
    return (0, response_1.sendSuccess)(res, null, "Expense deleted successfully");
}
//# sourceMappingURL=expense.controller.js.map
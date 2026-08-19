"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformOverview = getPlatformOverview;
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
async function getPlatformOverview(req, res) {
    const [totalUsers, totalMesses, activeSubscriptions, totalExpenses] = await Promise.all([
        database_1.prisma.user.count({ where: { deletedAt: null } }),
        database_1.prisma.mess.count({ where: { deletedAt: null } }),
        database_1.prisma.subscription.count({ where: { status: "ACTIVE" } }),
        database_1.prisma.expense.aggregate({
            where: { status: "APPROVED", deletedAt: null },
            _sum: { amount: true },
        }),
    ]);
    return (0, response_1.sendSuccess)(res, {
        totalUsers,
        totalMesses,
        activeSubscriptions,
        totalPlatformExpense: totalExpenses._sum.amount || 0,
    });
}
//# sourceMappingURL=super-admin.controller.js.map
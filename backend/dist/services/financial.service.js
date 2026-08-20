"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countMeals = countMeals;
exports.calculateMealRate = calculateMealRate;
exports.calculateMealCost = calculateMealCost;
exports.calculateBalance = calculateBalance;
exports.calculateDue = calculateDue;
exports.calculateAdvance = calculateAdvance;
exports.isMealExpense = isMealExpense;
exports.calculateMonthSummary = calculateMonthSummary;
exports.recalculateMonth = recalculateMonth;
exports.logFinancialTransaction = logFinancialTransaction;
const database_1 = require("../config/database");
const categories_1 = require("../utils/bills/categories");
function countMeals(entry) {
    const portion = (v) => typeof v === "boolean" ? (v ? 1 : 0) : Number(v) || 0;
    return portion(entry.breakfast) + portion(entry.lunch) + portion(entry.dinner);
}
function calculateMealRate(totalMealExpenses, totalMeals) {
    if (totalMeals <= 0)
        return 0;
    return totalMealExpenses / totalMeals;
}
function calculateMealCost(mealCount, mealRate) {
    return mealCount * mealRate;
}
function calculateBalance(totalDeposit, mealCost, billShare = 0) {
    return totalDeposit - mealCost - billShare;
}
function calculateDue(balance) {
    return Math.max(0, -balance);
}
function calculateAdvance(balance) {
    return Math.max(0, balance);
}
function isMealExpense(category) {
    if (category.isMealCost)
        return true;
    const n = category.name.toLowerCase();
    return n === "grocery" || n === "bazaar" || n.includes("meal");
}
async function calculateMonthSummary(messId, monthId) {
    const month = await database_1.prisma.messMonth.findFirst({
        where: { id: monthId, messId, deletedAt: null },
    });
    if (!month)
        return null;
    const [members, expenses, deposits, mealEntries, bills] = await Promise.all([
        database_1.prisma.member.findMany({
            where: { messId, deletedAt: null, status: "ACTIVE" },
            include: { user: { select: { id: true, name: true, email: true, image: true, phone: true } } },
        }),
        database_1.prisma.expense.findMany({
            where: { messId, monthId, deletedAt: null, status: "APPROVED" },
            include: { category: true },
        }),
        database_1.prisma.deposit.findMany({
            where: { messId, monthId, deletedAt: null, status: "APPROVED" },
        }),
        database_1.prisma.mealEntry.findMany({
            where: { messId, meal: { monthId } },
            select: { memberId: true, breakfast: true, lunch: true, dinner: true },
        }),
        database_1.prisma.bill.findMany({
            where: { messId, monthId, deletedAt: null },
            include: { memberShares: true },
        }),
    ]);
    const mealExpenses = expenses.filter((e) => isMealExpense(e.category));
    const totalMealExpenses = mealExpenses.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalDeposits = deposits.reduce((s, d) => s + d.amount, 0);
    const totalMeals = mealEntries.reduce((s, e) => s + countMeals(e), 0);
    const mealRate = calculateMealRate(totalMealExpenses, totalMeals);
    const totalSharedBills = bills.reduce((s, b) => s + b.amount, 0);
    let totalRent = 0;
    let totalUtilities = 0;
    for (const b of bills) {
        if ((0, categories_1.isRentCategory)(b.category))
            totalRent += b.amount;
        else if ((0, categories_1.isUtilityCategory)(b.category))
            totalUtilities += b.amount;
    }
    const memberBillMap = new Map();
    for (const m of members) {
        memberBillMap.set(m.id, (0, categories_1.emptyBillBreakdown)());
    }
    for (const bill of bills) {
        for (const share of bill.memberShares) {
            const current = memberBillMap.get(share.memberId) ?? (0, categories_1.emptyBillBreakdown)();
            memberBillMap.set(share.memberId, (0, categories_1.addToBillBreakdown)(current, bill.category, share.amount));
        }
    }
    const memberStats = members.map((m) => {
        const meals = mealEntries
            .filter((e) => e.memberId === m.id)
            .reduce((s, e) => s + countMeals(e), 0);
        const memberDeposits = deposits
            .filter((d) => d.memberId === m.id)
            .reduce((s, d) => s + d.amount, 0);
        const billShares = memberBillMap.get(m.id) ?? (0, categories_1.emptyBillBreakdown)();
        const mealCost = calculateMealCost(meals, mealRate);
        const totalBillShare = billShares.total;
        const totalCost = mealCost + totalBillShare;
        const balance = calculateBalance(memberDeposits, mealCost, totalBillShare);
        return {
            ...m,
            mealCount: meals,
            mealCost,
            totalDeposit: memberDeposits,
            balance,
            due: calculateDue(balance),
            advance: calculateAdvance(balance),
            sharedCostShare: totalBillShare,
            individualCost: totalCost,
            billShares,
            totalBillShare,
            totalCost,
        };
    });
    const totalDue = memberStats.reduce((s, m) => s + m.due, 0);
    const totalMealCost = totalMeals * mealRate;
    const messBalance = totalDeposits - totalExpenses - totalSharedBills;
    const billsByCategory = bills.reduce((acc, b) => {
        acc[b.category] = (acc[b.category] ?? 0) + b.amount;
        return acc;
    }, {});
    return {
        month: { ...month, sharedCost: totalSharedBills },
        totalExpenses,
        totalMealExpenses,
        totalDeposits,
        totalMeals,
        mealRate,
        totalDue,
        memberCount: members.length,
        members: memberStats,
        bills,
        billKpis: {
            totalRent,
            totalUtilities,
            totalSharedBills,
            totalMealCost,
            totalDeposits,
            totalDue,
            messBalance,
        },
        billsByCategory: billsByCategory,
    };
}
async function recalculateMonth(messId, monthId) {
    const summary = await calculateMonthSummary(messId, monthId);
    if (!summary)
        return null;
    await database_1.prisma.messMonth.update({
        where: { id: monthId },
        data: {
            totalMeals: summary.totalMeals,
            totalExpenses: summary.totalExpenses,
            totalDeposits: summary.totalDeposits,
            mealRate: summary.mealRate,
            sharedCost: summary.billKpis.totalSharedBills,
        },
    });
    for (const m of summary.members) {
        await database_1.prisma.member.update({
            where: { id: m.id },
            data: {
                totalMeals: m.mealCount,
                totalDue: m.due,
                totalDeposit: m.totalDeposit,
                advanceBalance: m.advance,
            },
        });
    }
    await database_1.prisma.mess.update({
        where: { id: messId },
        data: {
            totalMeals: summary.totalMeals,
            totalExpenses: summary.totalExpenses,
            mealRate: summary.mealRate,
        },
    });
    return summary;
}
async function logFinancialTransaction(data) {
    return database_1.prisma.financialTransaction.create({
        data: {
            messId: data.messId,
            monthId: data.monthId ?? null,
            type: data.type,
            amount: data.amount,
            memberId: data.memberId ?? null,
            createdById: data.createdById,
            referenceId: data.referenceId ?? null,
            referenceType: data.referenceType ?? null,
            description: data.description ?? null,
        },
    });
}
//# sourceMappingURL=financial.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealPortionToNumber = mealPortionToNumber;
exports.countMeals = countMeals;
exports.formatMealPortion = formatMealPortion;
exports.calculateMealRate = calculateMealRate;
exports.calculateMealCost = calculateMealCost;
exports.calculateSharedCostPerMember = calculateSharedCostPerMember;
exports.calculateBalance = calculateBalance;
exports.calculateDue = calculateDue;
exports.calculateAdvance = calculateAdvance;
exports.calculateMemberFinancials = calculateMemberFinancials;
exports.formatMonthLabel = formatMonthLabel;
exports.getCurrentYearMonth = getCurrentYearMonth;
exports.formatBdt = formatBdt;
const bill_categories_1 = require("../constants/bill-categories");
function mealPortionToNumber(value) {
    const n = typeof value === "number" ? value : parseFloat(value);
    if (n === 0.5)
        return 0.5;
    if (n >= 1)
        return 1;
    return 0;
}
function countMeals(entry) {
    const portion = (v) => typeof v === "boolean" ? (v ? 1 : 0) : Number(v) || 0;
    return portion(entry.breakfast) + portion(entry.lunch) + portion(entry.dinner);
}
function formatMealPortion(value) {
    if (value === 0)
        return "—";
    if (value === 0.5)
        return "½";
    return "1";
}
function calculateMealRate(totalMealExpenses, totalMeals) {
    if (totalMeals <= 0)
        return 0;
    return totalMealExpenses / totalMeals;
}
function calculateMealCost(mealCount, mealRate) {
    return mealCount * mealRate;
}
function calculateSharedCostPerMember(sharedCost, memberCount) {
    if (memberCount <= 0)
        return 0;
    return sharedCost / memberCount;
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
function calculateMemberFinancials(input) {
    const mealCost = calculateMealCost(input.mealCount, input.mealRate);
    const billShares = input.billShares ?? (0, bill_categories_1.emptyBillBreakdown)();
    const totalBillShare = billShares.total;
    const totalCost = mealCost + totalBillShare;
    const balance = calculateBalance(input.totalDeposit, mealCost, totalBillShare);
    return {
        memberId: input.memberId,
        mealCount: input.mealCount,
        mealCost,
        totalDeposit: input.totalDeposit,
        balance,
        due: calculateDue(balance),
        advance: calculateAdvance(balance),
        sharedCostShare: totalBillShare,
        individualCost: totalCost,
        billShares,
        totalBillShare,
        totalCost,
    };
}
function formatMonthLabel(year, month) {
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}
function getCurrentYearMonth() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
function formatBdt(amount) {
    const hasDecimals = Math.round(amount * 100) % 100 !== 0;
    const formatted = amount.toLocaleString("en-US", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
    });
    return `৳${formatted}`;
}
//# sourceMappingURL=calculations.js.map
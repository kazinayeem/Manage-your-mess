"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BILL_CATEGORIES = void 0;
exports.getBillCategoryLabel = getBillCategoryLabel;
exports.isRentCategory = isRentCategory;
exports.isUtilityCategory = isUtilityCategory;
exports.emptyBillBreakdown = emptyBillBreakdown;
exports.addToBillBreakdown = addToBillBreakdown;
exports.BILL_CATEGORIES = [
    { value: "HOUSE_RENT", label: "House Rent", group: "rent" },
    { value: "ELECTRICITY", label: "Electricity Bill", group: "utility" },
    { value: "WATER", label: "Water Bill", group: "utility" },
    { value: "GAS", label: "Gas Bill", group: "utility" },
    { value: "INTERNET", label: "Internet Bill", group: "utility" },
    { value: "CLEANER_SALARY", label: "Cleaner Salary", group: "service" },
    { value: "SECURITY_GUARD", label: "Security Guard", group: "service" },
    { value: "GENERATOR", label: "Generator Cost", group: "utility" },
    { value: "MAINTENANCE", label: "Maintenance Cost", group: "service" },
    { value: "GARBAGE", label: "Garbage Collection", group: "service" },
    { value: "PARKING", label: "Parking Fee", group: "other" },
    { value: "SERVICE_CHARGE", label: "Service Charge", group: "other" },
    { value: "FURNITURE_REPAIR", label: "Furniture Repair", group: "other" },
    { value: "EMERGENCY", label: "Emergency Expense", group: "other" },
    { value: "OTHER", label: "Other Shared Cost", group: "other" },
];
function getBillCategoryLabel(category) {
    return exports.BILL_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
function isRentCategory(category) {
    return category === "HOUSE_RENT";
}
function isUtilityCategory(category) {
    return ["ELECTRICITY", "WATER", "GAS", "INTERNET", "GENERATOR"].includes(category);
}
function emptyBillBreakdown() {
    return { rent: 0, electricity: 0, water: 0, gas: 0, internet: 0, maintenance: 0, other: 0, total: 0 };
}
function addToBillBreakdown(breakdown, category, amount) {
    const next = { ...breakdown };
    switch (category) {
        case "HOUSE_RENT":
            next.rent += amount;
            break;
        case "ELECTRICITY":
            next.electricity += amount;
            break;
        case "WATER":
            next.water += amount;
            break;
        case "GAS":
            next.gas += amount;
            break;
        case "INTERNET":
        case "GENERATOR":
            next.internet += amount;
            break;
        case "MAINTENANCE":
        case "CLEANER_SALARY":
        case "SECURITY_GUARD":
        case "GARBAGE":
            next.maintenance += amount;
            break;
        default:
            next.other += amount;
    }
    next.total = next.rent + next.electricity + next.water + next.gas + next.internet + next.maintenance + next.other;
    return next;
}
//# sourceMappingURL=bill-categories.js.map
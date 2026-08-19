"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlanLimits = parsePlanLimits;
exports.parsePlanFeatures = parsePlanFeatures;
exports.parseFeatureToggles = parseFeatureToggles;
exports.serializePlanJson = serializePlanJson;
exports.toParsedPlan = toParsedPlan;
exports.planHasFeature = planHasFeature;
exports.getPlanLimit = getPlanLimit;
exports.isPlanVisible = isPlanVisible;
exports.getMemberLimit = getMemberLimit;
exports.calculatePeriodEnd = calculatePeriodEnd;
exports.daysRemaining = daysRemaining;
exports.isSubscriptionActive = isSubscriptionActive;
const plan_constants_1 = require("../constants/plan-constants");
function parsePlanLimits(raw) {
    try {
        return JSON.parse(raw || "{}");
    }
    catch {
        return {};
    }
}
function parsePlanFeatures(raw) {
    try {
        return JSON.parse(raw || "[]");
    }
    catch {
        return [];
    }
}
function parseFeatureToggles(raw) {
    try {
        return JSON.parse(raw || "{}");
    }
    catch {
        return {};
    }
}
function serializePlanJson(limits, features, toggles) {
    return {
        limits: JSON.stringify(limits),
        features: JSON.stringify(features),
        featureToggles: JSON.stringify(toggles),
    };
}
function toParsedPlan(plan) {
    const limits = parsePlanLimits(plan.limits);
    const features = parsePlanFeatures(plan.features);
    const featureToggles = parseFeatureToggles(plan.featureToggles);
    return {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        durationType: plan.durationType,
        durationValue: plan.durationValue,
        customExpiryDate: plan.customExpiryDate,
        maxMembers: plan.maxMembers,
        limits: {
            members: limits.members ?? plan.maxMembers,
            branches: limits.branches ?? 1,
            storage_mb: limits.storage_mb ?? 100,
            reports: limits.reports ?? -1,
            pdf_exports: limits.pdf_exports ?? -1,
            excel_exports: limits.excel_exports ?? -1,
            csv_exports: limits.csv_exports ?? -1,
            monthly_transactions: limits.monthly_transactions ?? -1,
            api_requests: limits.api_requests ?? -1,
            bazaar_entries: limits.bazaar_entries ?? -1,
            expenses: limits.expenses ?? -1,
            bills: limits.bills ?? -1,
            notices: limits.notices ?? -1,
            tasks: limits.tasks ?? -1,
        },
        features,
        featureToggles,
        isActive: plan.isActive,
        isDefault: plan.isDefault,
        isPopular: plan.isPopular,
        isTrialPlan: plan.isTrialPlan,
        visibility: plan.visibility,
        isArchived: plan.isArchived,
        badge: plan.badge,
        color: plan.color,
        tier: plan.tier,
    };
}
function planHasFeature(plan, feature) {
    const parsed = "limits" in plan && typeof plan.limits === "object" && !Array.isArray(plan.limits)
        ? plan
        : toParsedPlan(plan);
    const key = plan_constants_1.LEGACY_FEATURE_MAP[feature] ?? feature;
    if (parsed.featureToggles[key] === false)
        return false;
    if (parsed.featureToggles[key] === true)
        return true;
    if (parsed.features.includes(key))
        return true;
    const legacyFeatures = parsePlanFeatures("features" in plan && typeof plan.features === "string"
        ? plan.features
        : JSON.stringify(parsed.features));
    return legacyFeatures.includes(feature) || legacyFeatures.includes(key);
}
function getPlanLimit(plan, limit) {
    const parsed = "limits" in plan && typeof plan.limits === "object" && !Array.isArray(plan.limits)
        ? plan
        : toParsedPlan(plan);
    return parsed.limits[limit] ?? -1;
}
function isPlanVisible(plan) {
    const parsed = "limits" in plan ? plan : toParsedPlan(plan);
    return parsed.isActive && !parsed.isArchived && parsed.visibility === "PUBLIC";
}
function getMemberLimit(plan) {
    const parsed = "limits" in plan && typeof plan.limits === "object" && !Array.isArray(plan.limits)
        ? plan
        : toParsedPlan(plan);
    if (planHasFeature(parsed, "unlimited_members"))
        return -1;
    return parsed.limits.members ?? parsed.maxMembers;
}
function calculatePeriodEnd(start, durationType, durationValue, customExpiryDate) {
    if (durationType === "CUSTOM_DATE" && customExpiryDate) {
        return new Date(customExpiryDate);
    }
    const end = new Date(start);
    switch (durationType) {
        case "DAYS":
            end.setDate(end.getDate() + durationValue);
            break;
        case "WEEKS":
            end.setDate(end.getDate() + durationValue * 7);
            break;
        case "MONTHS":
            end.setMonth(end.getMonth() + durationValue);
            break;
        case "YEARS":
            end.setFullYear(end.getFullYear() + durationValue);
            break;
        default:
            end.setMonth(end.getMonth() + 1);
    }
    return end;
}
function daysRemaining(endDate) {
    const diff = endDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}
function isSubscriptionActive(status, endDate) {
    if (status === "SUSPENDED" || status === "CANCELLED" || status === "EXPIRED")
        return false;
    if (status === "PENDING")
        return false;
    return endDate > new Date();
}
//# sourceMappingURL=plan-utils.js.map
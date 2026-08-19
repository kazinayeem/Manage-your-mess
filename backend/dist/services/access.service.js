"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_PLAN_SELECT = void 0;
exports.resolveMessMemberRole = resolveMessMemberRole;
exports.loadActiveUser = loadActiveUser;
exports.requireAuthUser = requireAuthUser;
exports.requireMessAccess = requireMessAccess;
exports.assertMemberScope = assertMemberScope;
exports.requireMessManager = requireMessManager;
exports.requireSuperAdmin = requireSuperAdmin;
exports.requireAdmin = requireAdmin;
exports.syncExpiredSubscriptions = syncExpiredSubscriptions;
exports.resolveSubscriptionAccess = resolveSubscriptionAccess;
exports.getSubscriptionAccessForMess = getSubscriptionAccessForMess;
exports.assertMessWriteAccess = assertMessWriteAccess;
exports.canUsePlanFeature = canUsePlanFeature;
exports.getFeatureAvailability = getFeatureAvailability;
exports.getUserSubscriptionAccess = getUserSubscriptionAccess;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const permissions_1 = require("../constants/permissions");
const plan_utils_1 = require("../utils/plan-utils");
const LEGACY_PLAN_SELECT = {
    id: true,
    slug: true,
    tier: true,
    name: true,
    description: true,
    price: true,
    currency: true,
    durationType: true,
    durationValue: true,
    customExpiryDate: true,
    maxMembers: true,
    limits: true,
    features: true,
    featureToggles: true,
    isActive: true,
    isDefault: true,
    isPopular: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
};
exports.LEGACY_PLAN_SELECT = LEGACY_PLAN_SELECT;
/**
 * Effective mess-scoped role resolution (mirrors lib/mess-role.ts):
 * - mess.managerId → MESS_MANAGER (full management)
 * - mess.ownerId (not manager) → MEMBER (view-only legal owner)
 * - stale elevated member roles → MEMBER
 */
function resolveMessMemberRole(member, mess) {
    if (mess.managerId && member.userId === mess.managerId)
        return "MESS_MANAGER";
    if (member.userId === mess.ownerId)
        return "MEMBER";
    if (member.role === "MESS_MANAGER" || member.role === "ASSISTANT_MANAGER" || member.role === "MESS_OWNER") {
        return "MEMBER";
    }
    return member.role;
}
async function loadActiveUser(userId) {
    const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
        throw new errors_1.AuthError("Account not found");
    if (!user.isActive)
        throw new errors_1.AuthError("Account suspended");
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
        throw new errors_1.AuthError("Account temporarily locked");
    }
    return user;
}
function requireAuthUser(user) {
    if (!user?.id)
        throw new errors_1.AuthError();
    return user;
}
async function requireMessAccess(user, messId, permission, opts) {
    const allowPlatformAdmin = opts?.allowPlatformAdmin ?? false;
    const mess = await database_1.prisma.mess.findFirst({
        where: { id: messId, deletedAt: null },
        include: {
            subscription: {
                select: {
                    id: true,
                    status: true,
                    currentPeriodEnd: true,
                    plan: { select: LEGACY_PLAN_SELECT },
                },
            },
        },
    });
    if (!mess)
        throw new errors_1.ForbiddenError("Mess not found");
    const member = await database_1.prisma.member.findFirst({
        where: { messId, userId: user.id, deletedAt: null },
    });
    const platformAdmin = (0, permissions_1.isAdminRole)(user.role);
    if (!member) {
        if (allowPlatformAdmin && platformAdmin) {
            const role = user.role;
            if (permission && !(0, permissions_1.hasPermission)(role, permissions_1.PERMISSIONS[permission])) {
                throw new errors_1.ForbiddenError();
            }
            return { user, member: null, mess, role };
        }
        throw new errors_1.ForbiddenError("Not a member of this mess");
    }
    if (member.status === "BANNED")
        throw new errors_1.ForbiddenError("You are banned from this mess");
    if (member.status === "PENDING")
        throw new errors_1.ForbiddenError("Membership pending approval");
    const role = resolveMessMemberRole({ userId: member.userId, role: member.role }, { ownerId: mess.ownerId, managerId: mess.managerId });
    if (permission && !(0, permissions_1.hasPermission)(role, permissions_1.PERMISSIONS[permission])) {
        throw new errors_1.ForbiddenError();
    }
    return { user, member, mess, role };
}
function assertMemberScope(access, targetMemberId) {
    const canManageOthers = (0, permissions_1.hasPermission)(access.role, permissions_1.PERMISSIONS.MEMBER_UPDATE);
    if (!canManageOthers && access.member?.id !== targetMemberId) {
        throw new errors_1.ForbiddenError("You can only modify your own records");
    }
}
async function requireMessManager(user, messId) {
    const access = await requireMessAccess(user, messId);
    if (!access.mess.managerId || access.mess.managerId !== access.user.id) {
        throw new errors_1.ForbiddenError("Only the manager can perform this action");
    }
    return access;
}
function requireSuperAdmin(user) {
    const session = requireAuthUser(user);
    if (!(0, permissions_1.isAdminRole)(session.role)) {
        throw new errors_1.ForbiddenError("Permission denied");
    }
    return session;
}
function requireAdmin(user) {
    const session = requireAuthUser(user);
    if (!(0, permissions_1.isAdminRole)(session.role)) {
        throw new errors_1.ForbiddenError("Permission denied");
    }
    return session;
}
function daysUntil(end) {
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}
async function syncExpiredSubscriptions(subscriptionId) {
    const now = new Date();
    await database_1.prisma.subscription.updateMany({
        where: {
            ...(subscriptionId ? { id: subscriptionId } : {}),
            status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
            currentPeriodEnd: { lt: now },
        },
        data: { status: "EXPIRED" },
    });
}
function resolveSubscriptionAccess(opts) {
    const { userActive, subscription } = opts;
    if (!userActive) {
        return {
            canView: true,
            canWrite: false,
            isExpired: false,
            isSuspended: true,
            isUserSuspended: true,
            isTrial: false,
            status: "SUSPENDED",
            plan: subscription?.plan ? (0, plan_utils_1.toParsedPlan)(subscription.plan) : null,
            reason: "Your account has been suspended by the platform administrator.",
            daysRemaining: 0,
            lockedMessage: "Your account has been suspended by the platform administrator.",
            allowedRoutePrefixes: ["/portal/subscription", "/pricing"],
        };
    }
    if (!subscription) {
        return {
            canView: true,
            canWrite: true,
            isExpired: false,
            isSuspended: false,
            isUserSuspended: false,
            isTrial: false,
            status: "ACTIVE",
            plan: null,
            reason: null,
            daysRemaining: 0,
            lockedMessage: null,
            allowedRoutePrefixes: [],
        };
    }
    const plan = subscription.plan ? (0, plan_utils_1.toParsedPlan)(subscription.plan) : null;
    const now = new Date();
    const pastEnd = subscription.currentPeriodEnd <= now;
    let status = subscription.status;
    if (pastEnd && (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE")) {
        status = "EXPIRED";
    }
    const isSuspended = status === "SUSPENDED" || status === "CANCELLED";
    const isExpired = status === "EXPIRED" || pastEnd;
    const isPending = status === "PENDING";
    const isTrial = status === "TRIALING";
    const canWrite = !isSuspended &&
        !isExpired &&
        !isPending &&
        (status === "ACTIVE" || status === "TRIALING") &&
        !pastEnd;
    let reason = null;
    if (isSuspended) {
        reason = subscription.suspendReason ?? "This account has been suspended by the platform administrator.";
    }
    else if (isExpired) {
        reason = "Your subscription has expired. Please renew to continue managing your mess.";
    }
    else if (isPending) {
        reason = "Your subscription is pending activation.";
    }
    const lockedMessage = isExpired
        ? "Your subscription has expired. Please renew your plan."
        : isPending
            ? "Please wait. Your payment is under review. Super Admin will verify and activate your subscription soon."
            : isSuspended
                ? reason
                : isTrial
                    ? `Your trial expires in ${daysUntil(subscription.trialEndsAt ?? subscription.currentPeriodEnd)} days`
                    : null;
    return {
        canView: true,
        canWrite,
        isExpired,
        isSuspended,
        isUserSuspended: false,
        isTrial,
        status,
        plan,
        reason,
        daysRemaining: daysUntil(subscription.currentPeriodEnd),
        lockedMessage,
        allowedRoutePrefixes: isExpired || isPending ? ["/portal/subscription", "/pricing"] : [],
    };
}
async function getSubscriptionAccessForMess(messId, userId) {
    const [mess, user] = await Promise.all([
        database_1.prisma.mess.findFirst({
            where: { id: messId, deletedAt: null },
            include: {
                subscription: {
                    select: {
                        id: true,
                        userId: true,
                        planId: true,
                        status: true,
                        currentPeriodStart: true,
                        currentPeriodEnd: true,
                        cancelAtPeriodEnd: true,
                        suspendedAt: true,
                        suspendReason: true,
                        stripeCustomerId: true,
                        stripeSubId: true,
                        createdAt: true,
                        updatedAt: true,
                        plan: { select: LEGACY_PLAN_SELECT },
                    },
                },
                owner: { select: { id: true, isActive: true } },
            },
        }),
        database_1.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } }),
    ]);
    if (!mess || !user) {
        return resolveSubscriptionAccess({ userActive: false, subscription: null });
    }
    let subscription = mess.subscription;
    if (!subscription) {
        const fallback = await database_1.prisma.subscription.findFirst({
            where: { userId: mess.ownerId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                userId: true,
                planId: true,
                status: true,
                currentPeriodStart: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                suspendedAt: true,
                suspendReason: true,
                stripeCustomerId: true,
                stripeSubId: true,
                createdAt: true,
                updatedAt: true,
                plan: { select: LEGACY_PLAN_SELECT },
            },
        });
        subscription = fallback;
    }
    if (subscription) {
        await syncExpiredSubscriptions(subscription.id);
        const fresh = await database_1.prisma.subscription.findUnique({
            where: { id: subscription.id },
            select: {
                id: true,
                userId: true,
                planId: true,
                status: true,
                currentPeriodStart: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                suspendedAt: true,
                suspendReason: true,
                stripeCustomerId: true,
                stripeSubId: true,
                createdAt: true,
                updatedAt: true,
                plan: { select: LEGACY_PLAN_SELECT },
            },
        });
        if (fresh)
            subscription = fresh;
    }
    return resolveSubscriptionAccess({
        userActive: user.isActive && mess.owner.isActive,
        subscription,
    });
}
async function assertMessWriteAccess(messId, userId) {
    const access = await getSubscriptionAccessForMess(messId, userId);
    if (!access.canWrite) {
        throw new errors_1.ForbiddenError(access.reason ?? "Subscription does not allow this action");
    }
    return access;
}
function canUsePlanFeature(access, feature, opts) {
    if (!access.plan)
        return true;
    if (!opts?.allowDuringExpired && (!access.canWrite || access.isSuspended))
        return false;
    return (0, plan_utils_1.planHasFeature)(access.plan, feature);
}
function getFeatureAvailability(access) {
    return {
        mealManagement: canUsePlanFeature(access, "meal_management"),
        depositManagement: canUsePlanFeature(access, "deposit_management"),
        expenseManagement: canUsePlanFeature(access, "expense_management"),
        bazaarManagement: canUsePlanFeature(access, "bazaar_management"),
        utilityBills: canUsePlanFeature(access, "utility_bills"),
        pdfReports: canUsePlanFeature(access, "pdf_reports"),
        excelReports: canUsePlanFeature(access, "excel_reports"),
        csvExport: canUsePlanFeature(access, "csv_export"),
        analytics: canUsePlanFeature(access, "analytics"),
        aiAnalytics: canUsePlanFeature(access, "ai_analytics"),
        roomManagement: canUsePlanFeature(access, "room_management"),
        bedManagement: canUsePlanFeature(access, "bed_management"),
        visitorManagement: canUsePlanFeature(access, "visitor_management"),
        taskManagement: canUsePlanFeature(access, "task_management"),
        noticeBoard: canUsePlanFeature(access, "notice_board"),
        inventory: canUsePlanFeature(access, "inventory"),
        apiAccess: canUsePlanFeature(access, "api_access"),
        whiteLabel: canUsePlanFeature(access, "white_label"),
        customBranding: canUsePlanFeature(access, "custom_branding"),
    };
}
async function getUserSubscriptionAccess(userId) {
    await syncExpiredSubscriptions();
    const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    const subscription = await database_1.prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            userId: true,
            planId: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            suspendedAt: true,
            suspendReason: true,
            stripeCustomerId: true,
            stripeSubId: true,
            createdAt: true,
            updatedAt: true,
            plan: { select: LEGACY_PLAN_SELECT },
        },
    });
    return resolveSubscriptionAccess({
        userActive: user?.isActive ?? false,
        subscription: subscription,
    });
}
//# sourceMappingURL=access.service.js.map
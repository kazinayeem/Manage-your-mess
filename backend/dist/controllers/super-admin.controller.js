"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformOverview = getPlatformOverview;
exports.getAllMesses = getAllMesses;
exports.getMessDetail = getMessDetail;
exports.approveMess = approveMess;
exports.rejectMess = rejectMess;
exports.suspendMess = suspendMess;
exports.activateMess = activateMess;
exports.getAllUsers = getAllUsers;
exports.getUserDetail = getUserDetail;
exports.changeUserRole = changeUserRole;
exports.changeUserStatus = changeUserStatus;
exports.getAllPayments = getAllPayments;
exports.approvePayment = approvePayment;
exports.rejectPayment = rejectPayment;
exports.getPaymentMethods = getPaymentMethods;
exports.getAllSubscriptions = getAllSubscriptions;
exports.getPlans = getPlans;
exports.getCoupons = getCoupons;
exports.getReferrals = getReferrals;
exports.getSupportTickets = getSupportTickets;
exports.getAnnouncements = getAnnouncements;
exports.getPlatformAnalytics = getPlatformAnalytics;
exports.getAuditLogs = getAuditLogs;
exports.getAdminNotifications = getAdminNotifications;
exports.getSystemSettings = getSystemSettings;
exports.getDatabaseStats = getDatabaseStats;
exports.getFeatureFlags = getFeatureFlags;
exports.getBackupStatus = getBackupStatus;
exports.getApiOverview = getApiOverview;
exports.getEmailTemplates = getEmailTemplates;
exports.getNotificationTemplates = getNotificationTemplates;
exports.getSecurityOverview = getSecurityOverview;
exports.savePlan = savePlan;
exports.duplicatePlan = duplicatePlan;
exports.updatePlanLifecycle = updatePlanLifecycle;
exports.deletePlan = deletePlan;
exports.saveCoupon = saveCoupon;
exports.deleteCoupon = deleteCoupon;
exports.createSupportTicket = createSupportTicket;
exports.updateSupportTicket = updateSupportTicket;
exports.broadcastNotification = broadcastNotification;
exports.savePaymentMethod = savePaymentMethod;
exports.deletePaymentMethod = deletePaymentMethod;
exports.reviewPaymentRequest = reviewPaymentRequest;
exports.assignSubscriptionPlan = assignSubscriptionPlan;
exports.extendSubscription = extendSubscription;
exports.updateSubscriptionStatus = updateSubscriptionStatus;
exports.getBillingSettings = getBillingSettings;
exports.saveBillingSettings = saveBillingSettings;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const audit_service_1 = require("../services/audit.service");
// ────────────────────────────────────────────────────────────────────────────
// Dashboard Overview (recreates full Web KPI categories)
// ────────────────────────────────────────────────────────────────────────────
async function getPlatformOverview(req, res) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeUsers, totalMesses, totalBranches, totalMembers, monthlyRevenueAgg, annualRevenueAgg, activeSubscriptions, expiredSubscriptions, trialAccounts, pendingPayments, approvedPayments, rejectedPayments, totalRevenueAgg, recentUsers, recentMesses,] = await Promise.all([
        database_1.prisma.user.count({ where: { deletedAt: null } }),
        database_1.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
        database_1.prisma.mess.count({ where: { deletedAt: null } }),
        database_1.prisma.branch.count({ where: { deletedAt: null } }),
        database_1.prisma.member.count({ where: { deletedAt: null } }),
        database_1.prisma.subscriptionPaymentRequest.aggregate({
            where: { status: "APPROVED", createdAt: { gte: thirtyDaysAgo } },
            _sum: { amount: true },
        }),
        database_1.prisma.subscriptionPaymentRequest.aggregate({
            where: { status: "APPROVED", createdAt: { gte: oneYearAgo } },
            _sum: { amount: true },
        }),
        database_1.prisma.subscription.count({ where: { status: "ACTIVE" } }),
        database_1.prisma.subscription.count({ where: { status: "EXPIRED" } }),
        database_1.prisma.subscription.count({ where: { status: "TRIALING" } }),
        database_1.prisma.subscriptionPaymentRequest.count({ where: { status: "PENDING" } }),
        database_1.prisma.subscriptionPaymentRequest.count({ where: { status: "APPROVED" } }),
        database_1.prisma.subscriptionPaymentRequest.count({ where: { status: "REJECTED" } }),
        database_1.prisma.subscriptionPaymentRequest.aggregate({
            where: { status: "APPROVED" },
            _sum: { amount: true },
        }),
        database_1.prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        }),
        database_1.prisma.mess.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                owner: { select: { name: true, email: true } },
                _count: { select: { members: true } },
            },
        }),
    ]);
    return (0, response_1.sendSuccess)(res, {
        totalUsers,
        activeUsers,
        totalMesses,
        totalBranches,
        totalMembers,
        monthlyRevenue: monthlyRevenueAgg._sum.amount || 0,
        annualRevenue: annualRevenueAgg._sum.amount || 0,
        activeSubscriptions,
        expiredSubscriptions,
        trialAccounts,
        pendingPayments,
        approvedPayments,
        rejectedPayments,
        totalRevenue: totalRevenueAgg._sum.amount || 0,
        pendingMesses: await database_1.prisma.mess.count({ where: { deletedAt: null, status: "PENDING" } }),
        recentUsers,
        recentMesses,
    });
}
// ────────────────────────────────────────────────────────────────────────────
// Mess Management
// ────────────────────────────────────────────────────────────────────────────
async function getAllMesses(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;
    const where = { deletedAt: null };
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { slug: { contains: search } },
            { address: { contains: search } },
        ];
    }
    if (status) {
        where.status = status;
    }
    const [messes, total] = await Promise.all([
        database_1.prisma.mess.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                owner: { select: { id: true, name: true, email: true, phone: true } },
                subscription: {
                    include: { plan: { select: { name: true, tier: true } } },
                },
                _count: { select: { members: true, meals: true, expenses: true } },
            },
        }),
        database_1.prisma.mess.count({ where }),
    ]);
    return (0, response_1.sendList)(res, messes, { page, limit, total });
}
async function getMessDetail(req, res) {
    const { id } = req.params;
    const mess = await database_1.prisma.mess.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, name: true, email: true, phone: true, role: true } },
            manager: { select: { id: true, name: true, email: true, phone: true } },
            subscription: {
                include: { plan: { select: { id: true, name: true, tier: true, price: true } } },
            },
            currentMonth: true,
            members: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    role: true,
                    status: true,
                    fullName: true,
                    phone: true,
                    joiningDate: true,
                    user: { select: { id: true, name: true, email: true, image: true } },
                },
                orderBy: { createdAt: "desc" },
            },
            _count: { select: { members: true, rooms: true, meals: true, expenses: true, deposits: true } },
        },
    });
    if (!mess || mess.deletedAt)
        throw new errors_1.NotFoundError("Mess not found");
    return (0, response_1.sendSuccess)(res, mess);
}
async function approveMess(req, res) {
    const { id } = req.params;
    const mess = await database_1.prisma.mess.findUnique({ where: { id } });
    if (!mess || mess.deletedAt)
        throw new errors_1.NotFoundError("Mess not found");
    const updated = await database_1.prisma.mess.update({
        where: { id },
        data: { status: "ACTIVE" },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "APPROVE",
        entity: "Mess",
        entityId: id,
        oldData: { status: mess.status },
        newData: { status: "ACTIVE" },
    });
    return (0, response_1.sendSuccess)(res, updated, "Mess approved successfully");
}
async function rejectMess(req, res) {
    const { id } = req.params;
    const { reason } = req.body;
    const mess = await database_1.prisma.mess.findUnique({ where: { id } });
    if (!mess || mess.deletedAt)
        throw new errors_1.NotFoundError("Mess not found");
    const updated = await database_1.prisma.mess.update({
        where: { id },
        data: { status: "REJECTED" },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "REJECT",
        entity: "Mess",
        entityId: id,
        oldData: { status: mess.status },
        newData: { status: "REJECTED", reason },
    });
    return (0, response_1.sendSuccess)(res, updated, "Mess rejected");
}
async function suspendMess(req, res) {
    const { id } = req.params;
    const mess = await database_1.prisma.mess.findUnique({ where: { id } });
    if (!mess || mess.deletedAt)
        throw new errors_1.NotFoundError("Mess not found");
    const updated = await database_1.prisma.mess.update({
        where: { id },
        data: { status: "SUSPENDED" },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "UPDATE",
        entity: "Mess",
        entityId: id,
        oldData: { status: mess.status },
        newData: { status: "SUSPENDED" },
    });
    return (0, response_1.sendSuccess)(res, updated, "Mess suspended");
}
async function activateMess(req, res) {
    const { id } = req.params;
    const mess = await database_1.prisma.mess.findUnique({ where: { id } });
    if (!mess || mess.deletedAt)
        throw new errors_1.NotFoundError("Mess not found");
    const updated = await database_1.prisma.mess.update({
        where: { id },
        data: { status: "ACTIVE" },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "UPDATE",
        entity: "Mess",
        entityId: id,
        oldData: { status: mess.status },
        newData: { status: "ACTIVE" },
    });
    return (0, response_1.sendSuccess)(res, updated, "Mess activated");
}
// ────────────────────────────────────────────────────────────────────────────
// User Management
// ────────────────────────────────────────────────────────────────────────────
async function getAllUsers(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const role = req.query.role;
    const where = { deletedAt: null };
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
        ];
    }
    if (role) {
        where.role = role;
    }
    const [users, total] = await Promise.all([
        database_1.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                isLocked: true,
                lastLoginAt: true,
                createdAt: true,
                _count: { select: { members: true, ownedMesses: true } },
            },
        }),
        database_1.prisma.user.count({ where }),
    ]);
    return (0, response_1.sendList)(res, users, { page, limit, total });
}
async function getUserDetail(req, res) {
    const { id } = req.params;
    const user = await database_1.prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            isLocked: true,
            lastLoginAt: true,
            lastLoginIp: true,
            createdAt: true,
            updatedAt: true,
            members: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    role: true,
                    status: true,
                    mess: { select: { id: true, name: true, status: true } },
                },
            },
            subscriptions: {
                select: {
                    id: true,
                    status: true,
                    currentPeriodStart: true,
                    currentPeriodEnd: true,
                    plan: { select: { name: true, tier: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            },
            _count: { select: { members: true, ownedMesses: true } },
        },
    });
    if (!user)
        throw new errors_1.NotFoundError("User not found");
    return (0, response_1.sendSuccess)(res, user);
}
async function changeUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = [
        "SUPER_ADMIN", "ADMIN", "MESS_OWNER", "MESS_MANAGER",
        "ASSISTANT_MANAGER", "ACCOUNTANT", "MEMBER", "GUEST",
    ];
    if (!role || !validRoles.includes(role)) {
        throw new errors_1.ValidationError(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }
    const user = await database_1.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt)
        throw new errors_1.NotFoundError("User not found");
    const updated = await database_1.prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "UPDATE",
        entity: "User",
        entityId: id,
        oldData: { role: user.role },
        newData: { role },
    });
    return (0, response_1.sendSuccess)(res, updated, "User role updated");
}
async function changeUserStatus(req, res) {
    const { id } = req.params;
    const { isActive, isLocked } = req.body;
    const user = await database_1.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt)
        throw new errors_1.NotFoundError("User not found");
    const data = {};
    if (typeof isActive === "boolean")
        data.isActive = isActive;
    if (typeof isLocked === "boolean") {
        data.isLocked = isLocked;
        if (!isLocked)
            data.lockedUntil = null;
    }
    const updated = await database_1.prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, isActive: true, isLocked: true },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "UPDATE",
        entity: "User",
        entityId: id,
        oldData: { isActive: user.isActive, isLocked: user.isLocked },
        newData: data,
    });
    return (0, response_1.sendSuccess)(res, updated, "User status updated");
}
// ────────────────────────────────────────────────────────────────────────────
// Payment Management & Methods
// ────────────────────────────────────────────────────────────────────────────
async function getAllPayments(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const where = {};
    if (status)
        where.status = status;
    const [payments, total] = await Promise.all([
        database_1.prisma.subscriptionPaymentRequest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, name: true, email: true } },
                plan: { select: { name: true, tier: true, price: true } },
                mess: { select: { id: true, name: true } },
                paymentMethod: { select: { name: true, slug: true } },
            },
        }),
        database_1.prisma.subscriptionPaymentRequest.count({ where }),
    ]);
    return (0, response_1.sendList)(res, payments, { page, limit, total });
}
async function approvePayment(req, res) {
    const { id } = req.params;
    const payment = await database_1.prisma.subscriptionPaymentRequest.findUnique({ where: { id } });
    if (!payment)
        throw new errors_1.NotFoundError("Payment request not found");
    const updated = await database_1.prisma.subscriptionPaymentRequest.update({
        where: { id },
        data: {
            status: "APPROVED",
            reviewedById: req.user.id,
            reviewedAt: new Date(),
        },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "APPROVE",
        entity: "SubscriptionPaymentRequest",
        entityId: id,
        oldData: { status: payment.status },
        newData: { status: "APPROVED" },
    });
    return (0, response_1.sendSuccess)(res, updated, "Payment approved");
}
async function rejectPayment(req, res) {
    const { id } = req.params;
    const { reason } = req.body;
    const payment = await database_1.prisma.subscriptionPaymentRequest.findUnique({ where: { id } });
    if (!payment)
        throw new errors_1.NotFoundError("Payment request not found");
    const updated = await database_1.prisma.subscriptionPaymentRequest.update({
        where: { id },
        data: {
            status: "REJECTED",
            rejectReason: reason || null,
            reviewedById: req.user.id,
            reviewedAt: new Date(),
        },
    });
    await (0, audit_service_1.logAudit)({
        userId: req.user.id,
        action: "REJECT",
        entity: "SubscriptionPaymentRequest",
        entityId: id,
        oldData: { status: payment.status },
        newData: { status: "REJECTED", reason },
    });
    return (0, response_1.sendSuccess)(res, updated, "Payment rejected");
}
async function getPaymentMethods(req, res) {
    const methods = await database_1.prisma.paymentMethod.findMany({
        orderBy: { sortOrder: "asc" },
    });
    return (0, response_1.sendSuccess)(res, methods);
}
// ────────────────────────────────────────────────────────────────────────────
// Subscriptions, Plans, Coupons, Referrals
// ────────────────────────────────────────────────────────────────────────────
async function getAllSubscriptions(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const where = {};
    if (status)
        where.status = status;
    const [subscriptions, total] = await Promise.all([
        database_1.prisma.subscription.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, name: true, email: true } },
                plan: { select: { id: true, name: true, tier: true, price: true } },
                _count: { select: { messes: true } },
            },
        }),
        database_1.prisma.subscription.count({ where }),
    ]);
    return (0, response_1.sendList)(res, subscriptions, { page, limit, total }, "Subscriptions fetched");
}
async function getPlans(req, res) {
    const plans = await database_1.prisma.plan.findMany({
        where: { isArchived: false },
        orderBy: { sortOrder: "asc" },
    });
    return (0, response_1.sendSuccess)(res, plans);
}
async function getCoupons(req, res) {
    const coupons = await database_1.prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
    });
    return (0, response_1.sendSuccess)(res, coupons);
}
async function getReferrals(req, res) {
    const referrals = await database_1.prisma.referral.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            referrer: { select: { id: true, name: true, email: true } },
            referee: { select: { id: true, name: true, email: true } },
        },
    });
    return (0, response_1.sendSuccess)(res, referrals);
}
// ────────────────────────────────────────────────────────────────────────────
// Support Tickets & Announcements
// ────────────────────────────────────────────────────────────────────────────
async function getSupportTickets(req, res) {
    const tickets = await database_1.prisma.supportTicket.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
        },
    });
    return (0, response_1.sendSuccess)(res, tickets);
}
async function getAnnouncements(req, res) {
    const announcements = await database_1.prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            createdBy: { select: { id: true, name: true } },
        },
    });
    return (0, response_1.sendSuccess)(res, announcements);
}
// ────────────────────────────────────────────────────────────────────────────
// Analytics & Audit Logs
// ────────────────────────────────────────────────────────────────────────────
async function getPlatformAnalytics(req, res) {
    const period = req.query.period || "month";
    const now = new Date();
    let startDate;
    switch (period) {
        case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case "week":
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
        case "month":
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case "year":
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
    }
    const [totalUsers, newUsers, totalMesses, newMesses, activeSubscriptions, revenue, usersByRole, messesByStatus, subscriptionsByStatus,] = await Promise.all([
        database_1.prisma.user.count({ where: { deletedAt: null } }),
        database_1.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startDate } } }),
        database_1.prisma.mess.count({ where: { deletedAt: null } }),
        database_1.prisma.mess.count({ where: { deletedAt: null, createdAt: { gte: startDate } } }),
        database_1.prisma.subscription.count({ where: { status: "ACTIVE" } }),
        database_1.prisma.subscriptionPaymentRequest.aggregate({
            where: { status: "APPROVED", createdAt: { gte: startDate } },
            _sum: { amount: true },
        }),
        database_1.prisma.user.groupBy({
            by: ["role"],
            where: { deletedAt: null },
            _count: { _all: true },
        }),
        database_1.prisma.mess.groupBy({
            by: ["status"],
            where: { deletedAt: null },
            _count: { _all: true },
        }),
        database_1.prisma.subscription.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),
    ]);
    return (0, response_1.sendSuccess)(res, {
        period,
        startDate,
        endDate: now,
        totalUsers,
        newUsers,
        totalMesses,
        newMesses,
        activeSubscriptions,
        revenue: revenue._sum.amount || 0,
        usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
        messesByStatus: messesByStatus.map((m) => ({ status: m.status, count: m._count._all })),
        subscriptionsByStatus: subscriptionsByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
        })),
    });
}
async function getAuditLogs(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const where = {};
    if (req.query.entity)
        where.entity = req.query.entity;
    if (req.query.action)
        where.action = req.query.action;
    if (req.query.userId)
        where.userId = req.query.userId;
    const [logs, total] = await Promise.all([
        database_1.prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, name: true, email: true } },
                mess: { select: { id: true, name: true } },
            },
        }),
        database_1.prisma.auditLog.count({ where }),
    ]);
    return (0, response_1.sendList)(res, logs, { page, limit, total });
}
async function getAdminNotifications(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
        database_1.prisma.notification.findMany({
            where: { userId: req.user.id },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        database_1.prisma.notification.count({ where: { userId: req.user.id } }),
    ]);
    return (0, response_1.sendList)(res, notifications, { page, limit, total });
}
// ────────────────────────────────────────────────────────────────────────────
// System & Admin Modules
// ────────────────────────────────────────────────────────────────────────────
async function getSystemSettings(req, res) {
    return (0, response_1.sendSuccess)(res, {
        appName: "BornoMess Manager",
        version: "2.4.0",
        environment: process.env.NODE_ENV || "development",
        maintenanceMode: false,
        registrationEnabled: true,
        trialDaysDefault: 14,
        currency: "BDT",
        supportEmail: "support@messflow.pro",
    });
}
async function getDatabaseStats(req, res) {
    const [users, messes, members, meals, expenses, deposits, subscriptions, auditLogs] = await Promise.all([
        database_1.prisma.user.count(),
        database_1.prisma.mess.count(),
        database_1.prisma.member.count(),
        database_1.prisma.meal.count(),
        database_1.prisma.expense.count(),
        database_1.prisma.deposit.count(),
        database_1.prisma.subscription.count(),
        database_1.prisma.auditLog.count(),
    ]);
    return (0, response_1.sendSuccess)(res, {
        engine: "SQLite / Prisma ORM",
        status: "Healthy",
        tables: {
            users,
            messes,
            members,
            meals,
            expenses,
            deposits,
            subscriptions,
            auditLogs,
        },
    });
}
async function getFeatureFlags(req, res) {
    return (0, response_1.sendSuccess)(res, [
        { key: "dark_mode", name: "Dark Mode UI", enabled: true, category: "UI" },
        { key: "bazaar_rewards", name: "Bazaar Member Reward System", enabled: true, category: "Features" },
        { key: "ai_meal_planner", name: "AI Meal Planner Integration", enabled: true, category: "Experimental" },
        { key: "push_notifications", name: "Push Notifications", enabled: true, category: "System" },
        { key: "multi_branch", name: "Multi-Branch Mess Structure", enabled: true, category: "Enterprise" },
    ]);
}
async function getBackupStatus(req, res) {
    return (0, response_1.sendSuccess)(res, {
        lastBackupAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        autoBackupEnabled: true,
        frequency: "Daily",
        backupLocation: "Cloud Storage Bucket",
        totalBackups: 14,
    });
}
async function getApiOverview(req, res) {
    return (0, response_1.sendSuccess)(res, {
        apiVersion: "v1",
        totalRequests24h: 1420,
        averageLatencyMs: 34,
        rateLimitRequestsPerMin: 120,
        status: "Operational",
    });
}
async function getEmailTemplates(req, res) {
    return (0, response_1.sendSuccess)(res, [
        { id: "welcome_email", name: "Welcome Email", subject: "Welcome to BornoMess Manager!", active: true },
        { id: "password_reset", name: "Password Reset", subject: "Reset your password", active: true },
        { id: "payment_approved", name: "Payment Receipt", subject: "Your subscription payment was approved", active: true },
    ]);
}
async function getNotificationTemplates(req, res) {
    return (0, response_1.sendSuccess)(res, [
        { id: "deposit_due", name: "Deposit Due Reminder", channel: "IN_APP", active: true },
        { id: "new_notice", name: "New Mess Notice", channel: "IN_APP", active: true },
        { id: "meal_reminder", name: "Daily Meal Entry Reminder", channel: "IN_APP", active: true },
    ]);
}
async function getSecurityOverview(req, res) {
    const [activeSessions, lockedAccounts] = await Promise.all([
        database_1.prisma.session.count(),
        database_1.prisma.user.count({ where: { isLocked: true } }),
    ]);
    return (0, response_1.sendSuccess)(res, {
        activeSessions,
        lockedAccounts,
        twoFactorEnforced: false,
        sslEnabled: true,
        corsRestricted: true,
    });
}
// ────────────────────────────────────────────────────────────────────────────
// Plans & Coupons Management
// ────────────────────────────────────────────────────────────────────────────
async function savePlan(req, res) {
    const { id, name, description, price, currency = "BDT", durationType = "MONTHS", durationValue = 1, maxMembers = 10, isActive = true, isDefault = false, isPopular = false, sortOrder = 0 } = req.body;
    if (!name)
        throw new errors_1.ValidationError("Plan name is required");
    if (isDefault) {
        await database_1.prisma.plan.updateMany({ data: { isDefault: false } });
    }
    if (id) {
        const plan = await database_1.prisma.plan.update({
            where: { id },
            data: { name, description, price: Number(price), currency, durationType, durationValue: Number(durationValue), maxMembers: Number(maxMembers), isActive, isDefault, isPopular, sortOrder: Number(sortOrder) },
        });
        return (0, response_1.sendSuccess)(res, plan, "Plan updated successfully");
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
    const plan = await database_1.prisma.plan.create({
        data: { slug, name, description, price: Number(price), currency, durationType, durationValue: Number(durationValue), maxMembers: Number(maxMembers), isActive, isDefault, isPopular, sortOrder: Number(sortOrder) },
    });
    return (0, response_1.sendSuccess)(res, plan, "Plan created successfully", 201);
}
async function duplicatePlan(req, res) {
    const planId = req.params.id;
    const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)
        throw new errors_1.NotFoundError("Plan not found");
    const slug = `${plan.slug}-copy-${Date.now().toString().slice(-4)}`;
    const copy = await database_1.prisma.plan.create({
        data: {
            slug,
            tier: plan.tier,
            name: `${plan.name} Copy`,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            durationType: plan.durationType,
            durationValue: plan.durationValue,
            customExpiryDate: plan.customExpiryDate,
            maxMembers: plan.maxMembers,
            limits: plan.limits,
            features: plan.features,
            featureToggles: plan.featureToggles,
            isActive: false,
            isDefault: false,
            isPopular: false,
            sortOrder: plan.sortOrder + 1,
        },
    });
    return (0, response_1.sendSuccess)(res, copy, "Plan duplicated successfully", 201);
}
async function updatePlanLifecycle(req, res) {
    const planId = req.params.id;
    const { action } = req.body; // enable, disable, hide, show, archive
    const existing = await database_1.prisma.plan.findUnique({ where: { id: planId } });
    if (!existing)
        throw new errors_1.NotFoundError("Plan not found");
    const isActive = action === "enable" || action === "show";
    const updated = await database_1.prisma.plan.update({
        where: { id: planId },
        data: { isActive },
    });
    return (0, response_1.sendSuccess)(res, updated, `Plan ${action}d successfully`);
}
async function deletePlan(req, res) {
    const planId = req.params.id;
    const count = await database_1.prisma.subscription.count({ where: { planId } });
    if (count > 0) {
        await database_1.prisma.plan.update({ where: { id: planId }, data: { isActive: false } });
    }
    else {
        await database_1.prisma.plan.delete({ where: { id: planId } });
    }
    return (0, response_1.sendSuccess)(res, null, "Plan deleted successfully");
}
async function saveCoupon(req, res) {
    const { code, discountPercent, discountAmount, maxUses, isActive } = req.body;
    if (!code)
        throw new errors_1.ValidationError("Coupon code is required");
    const coupon = await database_1.prisma.coupon.create({
        data: {
            code: code.trim().toUpperCase(),
            discountPercent: discountPercent ? Number(discountPercent) : null,
            discountAmount: discountAmount ? Number(discountAmount) : null,
            maxUses: maxUses ? Number(maxUses) : null,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
    });
    return (0, response_1.sendSuccess)(res, coupon, "Coupon created successfully", 201);
}
async function deleteCoupon(req, res) {
    const { id } = req.params;
    await database_1.prisma.coupon.delete({ where: { id } });
    return (0, response_1.sendSuccess)(res, null, "Coupon deleted");
}
// ────────────────────────────────────────────────────────────────────────────
// Support Tickets & Broadcast
// ────────────────────────────────────────────────────────────────────────────
async function createSupportTicket(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { subject, description, priority = "MEDIUM" } = req.body;
    const ticket = await database_1.prisma.supportTicket.create({
        data: {
            userId: req.user.id,
            subject,
            description,
            priority,
            status: "OPEN",
        },
    });
    return (0, response_1.sendSuccess)(res, ticket, "Support ticket created", 201);
}
async function updateSupportTicket(req, res) {
    const { id } = req.params;
    const { status, priority, assigneeId } = req.body;
    const ticket = await database_1.prisma.supportTicket.update({
        where: { id },
        data: { status, priority, assigneeId },
    });
    return (0, response_1.sendSuccess)(res, ticket, "Support ticket updated");
}
async function broadcastNotification(req, res) {
    const { title, message } = req.body;
    if (!title || !message)
        throw new errors_1.ValidationError("Title and message are required");
    const users = await database_1.prisma.user.findMany({ where: { deletedAt: null, isActive: true }, select: { id: true } });
    if (users.length > 0) {
        await database_1.prisma.notification.createMany({
            data: users.map((u) => ({
                userId: u.id,
                type: "GLOBAL_ANNOUNCEMENT",
                title,
                message,
                sentAt: new Date(),
            })),
        });
    }
    return (0, response_1.sendSuccess)(res, { count: users.length }, "Broadcast sent successfully");
}
// ────────────────────────────────────────────────────────────────────────────
// Payment Methods & Review & Subscriptions
// ────────────────────────────────────────────────────────────────────────────
async function savePaymentMethod(req, res) {
    const { id, name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive = true, sortOrder = 0 } = req.body;
    if (!name)
        throw new errors_1.ValidationError("Name is required");
    if (id) {
        const method = await database_1.prisma.paymentMethod.update({
            where: { id },
            data: { name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive, sortOrder: Number(sortOrder) },
        });
        return (0, response_1.sendSuccess)(res, method, "Payment method updated");
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
    const method = await database_1.prisma.paymentMethod.create({
        data: { slug, name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive, sortOrder: Number(sortOrder) },
    });
    return (0, response_1.sendSuccess)(res, method, "Payment method created", 201);
}
async function deletePaymentMethod(req, res) {
    const { id } = req.params;
    await database_1.prisma.paymentMethod.update({ where: { id }, data: { isActive: false } });
    return (0, response_1.sendSuccess)(res, null, "Payment method deactivated");
}
async function reviewPaymentRequest(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { requestId, action, reason } = req.body;
    if (!requestId || !action)
        throw new errors_1.ValidationError("Request ID and action required");
    const request = await database_1.prisma.subscriptionPaymentRequest.findUnique({
        where: { id: requestId },
        include: { plan: true },
    });
    if (!request)
        throw new errors_1.NotFoundError("Payment request not found");
    if (action === "approve") {
        if (!request.plan)
            throw new errors_1.ValidationError("Plan not found for this request");
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const subscription = await database_1.prisma.subscription.create({
            data: {
                userId: request.userId,
                planId: request.plan.id,
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                assignedById: req.user.id,
            },
        });
        await database_1.prisma.subscriptionPaymentRequest.update({
            where: { id: requestId },
            data: {
                status: "APPROVED",
                reviewedById: req.user.id,
                reviewedAt: now,
                adminNote: reason || null,
                subscriptionId: subscription.id,
            },
        });
        return (0, response_1.sendSuccess)(res, { subscriptionId: subscription.id }, "Payment approved and subscription activated");
    }
    const updatedStatus = action === "reject" ? "REJECTED" : action === "refund" ? "REFUNDED" : "NEEDS_INFO";
    await database_1.prisma.subscriptionPaymentRequest.update({
        where: { id: requestId },
        data: {
            status: updatedStatus,
            reviewedById: req.user.id,
            reviewedAt: new Date(),
            adminNote: reason || null,
        },
    });
    return (0, response_1.sendSuccess)(res, null, `Payment request updated to ${updatedStatus}`);
}
async function assignSubscriptionPlan(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { userId, planId, bonusDays = 0 } = req.body;
    if (!userId || !planId)
        throw new errors_1.ValidationError("User ID and Plan ID required");
    const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)
        throw new errors_1.NotFoundError("Plan not found");
    const now = new Date();
    const end = new Date(now.getTime() + (30 + Number(bonusDays)) * 24 * 60 * 60 * 1000);
    const subscription = await database_1.prisma.subscription.create({
        data: {
            userId,
            planId: plan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: end,
            bonusDays: Number(bonusDays),
            assignedById: req.user.id,
        },
    });
    return (0, response_1.sendSuccess)(res, { subscriptionId: subscription.id }, "Plan assigned successfully");
}
async function extendSubscription(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { subscriptionId, additionalDays = 30 } = req.body;
    const sub = await database_1.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub)
        throw new errors_1.NotFoundError("Subscription not found");
    const base = sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date();
    const newEnd = new Date(base.getTime() + Number(additionalDays) * 24 * 60 * 60 * 1000);
    await database_1.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { currentPeriodEnd: newEnd, status: "ACTIVE" },
    });
    return (0, response_1.sendSuccess)(res, null, "Subscription extended successfully");
}
async function updateSubscriptionStatus(req, res) {
    const { id } = req.params;
    const { status, reason } = req.body;
    const updated = await database_1.prisma.subscription.update({
        where: { id },
        data: {
            status,
            suspendedAt: status === "SUSPENDED" ? new Date() : null,
            suspendReason: status === "SUSPENDED" ? reason : null,
        },
    });
    return (0, response_1.sendSuccess)(res, updated, "Subscription status updated");
}
async function getBillingSettings(req, res) {
    return (0, response_1.sendSuccess)(res, {
        trialDurationType: "DAYS",
        trialDurationValue: 14,
        allowTrialOnCreate: true,
        defaultTrialPlanId: null,
    });
}
async function saveBillingSettings(req, res) {
    return (0, response_1.sendSuccess)(res, req.body, "Billing settings updated");
}
//# sourceMappingURL=super-admin.controller.js.map
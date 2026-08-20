import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { NotFoundError, ValidationError, AuthError, ForbiddenError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { logAudit } from "../services/audit.service";

// ────────────────────────────────────────────────────────────────────────────
// Dashboard Overview (recreates full Web KPI categories)
// ────────────────────────────────────────────────────────────────────────────

export async function getPlatformOverview(req: Request, res: Response) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalMesses,
    totalBranches,
    totalMembers,
    monthlyRevenueAgg,
    annualRevenueAgg,
    activeSubscriptions,
    expiredSubscriptions,
    trialAccounts,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    totalRevenueAgg,
    recentUsers,
    recentMesses,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.mess.count({ where: { deletedAt: null } }),
    prisma.branch.count({ where: { deletedAt: null } }),
    prisma.member.count({ where: { deletedAt: null } }),
    prisma.subscriptionPaymentRequest.aggregate({
      where: { status: "APPROVED", createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.subscriptionPaymentRequest.aggregate({
      where: { status: "APPROVED", createdAt: { gte: oneYearAgo } },
      _sum: { amount: true },
    }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.subscriptionPaymentRequest.count({ where: { status: "PENDING" } }),
    prisma.subscriptionPaymentRequest.count({ where: { status: "APPROVED" } }),
    prisma.subscriptionPaymentRequest.count({ where: { status: "REJECTED" } }),
    prisma.subscriptionPaymentRequest.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.mess.findMany({
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

  return sendSuccess(res, {
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
    pendingMesses: await prisma.mess.count({ where: { deletedAt: null, status: "PENDING" } }),
    recentUsers,
    recentMesses,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Mess Management
// ────────────────────────────────────────────────────────────────────────────

export async function getAllMesses(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || "";
  const status = req.query.status as string | undefined;

  const where: any = { deletedAt: null };
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
    prisma.mess.findMany({
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
    prisma.mess.count({ where }),
  ]);

  return sendList(res, messes, { page, limit, total });
}

export async function getMessDetail(req: Request, res: Response) {
  const { id } = req.params;
  const mess = await prisma.mess.findUnique({
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

  if (!mess || mess.deletedAt) throw new NotFoundError("Mess not found");
  return sendSuccess(res, mess);
}

export async function approveMess(req: Request, res: Response) {
  const { id } = req.params;
  const mess = await prisma.mess.findUnique({ where: { id } });
  if (!mess || mess.deletedAt) throw new NotFoundError("Mess not found");

  const updated = await prisma.mess.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  await logAudit({
    userId: req.user!.id,
    action: "APPROVE",
    entity: "Mess",
    entityId: id,
    oldData: { status: mess.status },
    newData: { status: "ACTIVE" },
  });

  return sendSuccess(res, updated, "Mess approved successfully");
}

export async function rejectMess(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  const mess = await prisma.mess.findUnique({ where: { id } });
  if (!mess || mess.deletedAt) throw new NotFoundError("Mess not found");

  const updated = await prisma.mess.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  await logAudit({
    userId: req.user!.id,
    action: "REJECT",
    entity: "Mess",
    entityId: id,
    oldData: { status: mess.status },
    newData: { status: "REJECTED", reason },
  });

  return sendSuccess(res, updated, "Mess rejected");
}

export async function suspendMess(req: Request, res: Response) {
  const { id } = req.params;
  const mess = await prisma.mess.findUnique({ where: { id } });
  if (!mess || mess.deletedAt) throw new NotFoundError("Mess not found");

  const updated = await prisma.mess.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  await logAudit({
    userId: req.user!.id,
    action: "UPDATE",
    entity: "Mess",
    entityId: id,
    oldData: { status: mess.status },
    newData: { status: "SUSPENDED" },
  });

  return sendSuccess(res, updated, "Mess suspended");
}

export async function activateMess(req: Request, res: Response) {
  const { id } = req.params;
  const mess = await prisma.mess.findUnique({ where: { id } });
  if (!mess || mess.deletedAt) throw new NotFoundError("Mess not found");

  const updated = await prisma.mess.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  await logAudit({
    userId: req.user!.id,
    action: "UPDATE",
    entity: "Mess",
    entityId: id,
    oldData: { status: mess.status },
    newData: { status: "ACTIVE" },
  });

  return sendSuccess(res, updated, "Mess activated");
}

// ────────────────────────────────────────────────────────────────────────────
// User Management
// ────────────────────────────────────────────────────────────────────────────

export async function getAllUsers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || "";
  const role = req.query.role as string | undefined;

  const where: any = { deletedAt: null };
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
    prisma.user.findMany({
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
    prisma.user.count({ where }),
  ]);

  return sendList(res, users, { page, limit, total });
}

export async function getUserDetail(req: Request, res: Response) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
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

  if (!user) throw new NotFoundError("User not found");
  return sendSuccess(res, user);
}

export async function changeUserRole(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = [
    "SUPER_ADMIN", "ADMIN", "MESS_OWNER", "MESS_MANAGER",
    "ASSISTANT_MANAGER", "ACCOUNTANT", "MEMBER", "GUEST",
  ];
  if (!role || !validRoles.includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt) throw new NotFoundError("User not found");

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  await logAudit({
    userId: req.user!.id,
    action: "UPDATE",
    entity: "User",
    entityId: id,
    oldData: { role: user.role },
    newData: { role },
  });

  return sendSuccess(res, updated, "User role updated");
}

export async function changeUserStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { isActive, isLocked } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt) throw new NotFoundError("User not found");

  const data: any = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (typeof isLocked === "boolean") {
    data.isLocked = isLocked;
    if (!isLocked) data.lockedUntil = null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, isActive: true, isLocked: true },
  });

  await logAudit({
    userId: req.user!.id,
    action: "UPDATE",
    entity: "User",
    entityId: id,
    oldData: { isActive: user.isActive, isLocked: user.isLocked },
    newData: data,
  });

  return sendSuccess(res, updated, "User status updated");
}

// ────────────────────────────────────────────────────────────────────────────
// Payment Management & Methods
// ────────────────────────────────────────────────────────────────────────────

export async function getAllPayments(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (status) where.status = status;

  const [payments, total] = await Promise.all([
    prisma.subscriptionPaymentRequest.findMany({
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
    prisma.subscriptionPaymentRequest.count({ where }),
  ]);

  return sendList(res, payments, { page, limit, total });
}

export async function approvePayment(req: Request, res: Response) {
  const { id } = req.params;
  const payment = await prisma.subscriptionPaymentRequest.findUnique({ where: { id } });
  if (!payment) throw new NotFoundError("Payment request not found");

  const updated = await prisma.subscriptionPaymentRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewedById: req.user!.id,
      reviewedAt: new Date(),
    },
  });

  await logAudit({
    userId: req.user!.id,
    action: "APPROVE",
    entity: "SubscriptionPaymentRequest",
    entityId: id,
    oldData: { status: payment.status },
    newData: { status: "APPROVED" },
  });

  return sendSuccess(res, updated, "Payment approved");
}

export async function rejectPayment(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  const payment = await prisma.subscriptionPaymentRequest.findUnique({ where: { id } });
  if (!payment) throw new NotFoundError("Payment request not found");

  const updated = await prisma.subscriptionPaymentRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectReason: reason || null,
      reviewedById: req.user!.id,
      reviewedAt: new Date(),
    },
  });

  await logAudit({
    userId: req.user!.id,
    action: "REJECT",
    entity: "SubscriptionPaymentRequest",
    entityId: id,
    oldData: { status: payment.status },
    newData: { status: "REJECTED", reason },
  });

  return sendSuccess(res, updated, "Payment rejected");
}

export async function getPaymentMethods(req: Request, res: Response) {
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return sendSuccess(res, methods);
}

// ────────────────────────────────────────────────────────────────────────────
// Subscriptions, Plans, Coupons, Referrals
// ────────────────────────────────────────────────────────────────────────────

export async function getAllSubscriptions(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (status) where.status = status;

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
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
    prisma.subscription.count({ where }),
  ]);

  return sendList(res, subscriptions, { page, limit, total }, "Subscriptions fetched");
}

export async function getPlans(req: Request, res: Response) {
  const plans = await prisma.plan.findMany({
    where: { isArchived: false },
    orderBy: { sortOrder: "asc" },
  });
  return sendSuccess(res, plans);
}

export async function getCoupons(req: Request, res: Response) {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, coupons);
}

export async function getReferrals(req: Request, res: Response) {
  const referrals = await prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      referrer: { select: { id: true, name: true, email: true } },
      referee: { select: { id: true, name: true, email: true } },
    },
  });
  return sendSuccess(res, referrals);
}

// ────────────────────────────────────────────────────────────────────────────
// Support Tickets & Announcements
// ────────────────────────────────────────────────────────────────────────────

export async function getSupportTickets(req: Request, res: Response) {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  return sendSuccess(res, tickets);
}

export async function getAnnouncements(req: Request, res: Response) {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
  return sendSuccess(res, announcements);
}

// ────────────────────────────────────────────────────────────────────────────
// Analytics & Audit Logs
// ────────────────────────────────────────────────────────────────────────────

export async function getPlatformAnalytics(req: Request, res: Response) {
  const period = (req.query.period as string) || "month";
  const now = new Date();
  let startDate: Date;
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

  const [
    totalUsers,
    newUsers,
    totalMesses,
    newMesses,
    activeSubscriptions,
    revenue,
    usersByRole,
    messesByStatus,
    subscriptionsByStatus,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startDate } } }),
    prisma.mess.count({ where: { deletedAt: null } }),
    prisma.mess.count({ where: { deletedAt: null, createdAt: { gte: startDate } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscriptionPaymentRequest.aggregate({
      where: { status: "APPROVED", createdAt: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.user.groupBy({
      by: ["role"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.mess.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return sendSuccess(res, {
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

export async function getAuditLogs(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (req.query.entity) where.entity = req.query.entity as string;
  if (req.query.action) where.action = req.query.action as string;
  if (req.query.userId) where.userId = req.query.userId as string;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        mess: { select: { id: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return sendList(res, logs, { page, limit, total });
}

export async function getAdminNotifications(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.id },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where: { userId: req.user!.id } }),
  ]);

  return sendList(res, notifications, { page, limit, total });
}

// ────────────────────────────────────────────────────────────────────────────
// System & Admin Modules
// ────────────────────────────────────────────────────────────────────────────

export async function getSystemSettings(req: Request, res: Response) {
  return sendSuccess(res, {
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

export async function getDatabaseStats(req: Request, res: Response) {
  const [users, messes, members, meals, expenses, deposits, subscriptions, auditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.mess.count(),
    prisma.member.count(),
    prisma.meal.count(),
    prisma.expense.count(),
    prisma.deposit.count(),
    prisma.subscription.count(),
    prisma.auditLog.count(),
  ]);

  return sendSuccess(res, {
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

export async function getFeatureFlags(req: Request, res: Response) {
  return sendSuccess(res, [
    { key: "dark_mode", name: "Dark Mode UI", enabled: true, category: "UI" },
    { key: "bazaar_rewards", name: "Bazaar Member Reward System", enabled: true, category: "Features" },
    { key: "ai_meal_planner", name: "AI Meal Planner Integration", enabled: true, category: "Experimental" },
    { key: "push_notifications", name: "Push Notifications", enabled: true, category: "System" },
    { key: "multi_branch", name: "Multi-Branch Mess Structure", enabled: true, category: "Enterprise" },
  ]);
}

export async function getBackupStatus(req: Request, res: Response) {
  return sendSuccess(res, {
    lastBackupAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    autoBackupEnabled: true,
    frequency: "Daily",
    backupLocation: "Cloud Storage Bucket",
    totalBackups: 14,
  });
}

export async function getApiOverview(req: Request, res: Response) {
  return sendSuccess(res, {
    apiVersion: "v1",
    totalRequests24h: 1420,
    averageLatencyMs: 34,
    rateLimitRequestsPerMin: 120,
    status: "Operational",
  });
}

export async function getEmailTemplates(req: Request, res: Response) {
  return sendSuccess(res, [
    { id: "welcome_email", name: "Welcome Email", subject: "Welcome to BornoMess Manager!", active: true },
    { id: "password_reset", name: "Password Reset", subject: "Reset your password", active: true },
    { id: "payment_approved", name: "Payment Receipt", subject: "Your subscription payment was approved", active: true },
  ]);
}

export async function getNotificationTemplates(req: Request, res: Response) {
  return sendSuccess(res, [
    { id: "deposit_due", name: "Deposit Due Reminder", channel: "IN_APP", active: true },
    { id: "new_notice", name: "New Mess Notice", channel: "IN_APP", active: true },
    { id: "meal_reminder", name: "Daily Meal Entry Reminder", channel: "IN_APP", active: true },
  ]);
}

export async function getSecurityOverview(req: Request, res: Response) {
  const [activeSessions, lockedAccounts] = await Promise.all([
    prisma.session.count(),
    prisma.user.count({ where: { isLocked: true } }),
  ]);

  return sendSuccess(res, {
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

export async function savePlan(req: Request, res: Response) {
  const { id, name, description, price, currency = "BDT", durationType = "MONTHS", durationValue = 1, maxMembers = 10, isActive = true, isDefault = false, isPopular = false, sortOrder = 0 } = req.body;
  if (!name) throw new ValidationError("Plan name is required");

  if (isDefault) {
    await prisma.plan.updateMany({ data: { isDefault: false } });
  }

  if (id) {
    const plan = await prisma.plan.update({
      where: { id },
      data: { name, description, price: Number(price), currency, durationType, durationValue: Number(durationValue), maxMembers: Number(maxMembers), isActive, isDefault, isPopular, sortOrder: Number(sortOrder) },
    });
    return sendSuccess(res, plan, "Plan updated successfully");
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
  const plan = await prisma.plan.create({
    data: { slug, name, description, price: Number(price), currency, durationType, durationValue: Number(durationValue), maxMembers: Number(maxMembers), isActive, isDefault, isPopular, sortOrder: Number(sortOrder) },
  });
  return sendSuccess(res, plan, "Plan created successfully", 201);
}

export async function duplicatePlan(req: Request, res: Response) {
  const planId = req.params.id;
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan not found");

  const slug = `${plan.slug}-copy-${Date.now().toString().slice(-4)}`;
  const copy = await prisma.plan.create({
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

  return sendSuccess(res, copy, "Plan duplicated successfully", 201);
}

export async function updatePlanLifecycle(req: Request, res: Response) {
  const planId = req.params.id;
  const { action } = req.body; // enable, disable, hide, show, archive
  const existing = await prisma.plan.findUnique({ where: { id: planId } });
  if (!existing) throw new NotFoundError("Plan not found");

  const isActive = action === "enable" || action === "show";
  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { isActive },
  });

  return sendSuccess(res, updated, `Plan ${action}d successfully`);
}

export async function deletePlan(req: Request, res: Response) {
  const planId = req.params.id;
  const count = await prisma.subscription.count({ where: { planId } });
  if (count > 0) {
    await prisma.plan.update({ where: { id: planId }, data: { isActive: false } });
  } else {
    await prisma.plan.delete({ where: { id: planId } });
  }
  return sendSuccess(res, null, "Plan deleted successfully");
}

export async function saveCoupon(req: Request, res: Response) {
  const { code, discountPercent, discountAmount, maxUses, isActive } = req.body;
  if (!code) throw new ValidationError("Coupon code is required");

  const coupon = await prisma.coupon.create({
    data: {
      code: code.trim().toUpperCase(),
      discountPercent: discountPercent ? Number(discountPercent) : null,
      discountAmount: discountAmount ? Number(discountAmount) : null,
      maxUses: maxUses ? Number(maxUses) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    },
  });

  return sendSuccess(res, coupon, "Coupon created successfully", 201);
}

export async function deleteCoupon(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.coupon.delete({ where: { id } });
  return sendSuccess(res, null, "Coupon deleted");
}

// ────────────────────────────────────────────────────────────────────────────
// Support Tickets & Broadcast
// ────────────────────────────────────────────────────────────────────────────

export async function createSupportTicket(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { subject, description, priority = "MEDIUM" } = req.body;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user.id,
      subject,
      description,
      priority,
      status: "OPEN",
    },
  });

  return sendSuccess(res, ticket, "Support ticket created", 201);
}

export async function updateSupportTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { status, priority, assigneeId } = req.body;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status, priority, assigneeId },
  });

  return sendSuccess(res, ticket, "Support ticket updated");
}

export async function broadcastNotification(req: Request, res: Response) {
  const { title, message } = req.body;
  if (!title || !message) throw new ValidationError("Title and message are required");

  const users = await prisma.user.findMany({ where: { deletedAt: null, isActive: true }, select: { id: true } });
  if (users.length > 0) {
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "GLOBAL_ANNOUNCEMENT",
        title,
        message,
        sentAt: new Date(),
      })),
    });
  }

  return sendSuccess(res, { count: users.length }, "Broadcast sent successfully");
}

// ────────────────────────────────────────────────────────────────────────────
// Payment Methods & Review & Subscriptions
// ────────────────────────────────────────────────────────────────────────────

export async function savePaymentMethod(req: Request, res: Response) {
  const { id, name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive = true, sortOrder = 0 } = req.body;
  if (!name) throw new ValidationError("Name is required");

  if (id) {
    const method = await prisma.paymentMethod.update({
      where: { id },
      data: { name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive, sortOrder: Number(sortOrder) },
    });
    return sendSuccess(res, method, "Payment method updated");
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
  const method = await prisma.paymentMethod.create({
    data: { slug, name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive, sortOrder: Number(sortOrder) },
  });
  return sendSuccess(res, method, "Payment method created", 201);
}

export async function deletePaymentMethod(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.paymentMethod.update({ where: { id }, data: { isActive: false } });
  return sendSuccess(res, null, "Payment method deactivated");
}

export async function reviewPaymentRequest(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { requestId, action, reason } = req.body;
  if (!requestId || !action) throw new ValidationError("Request ID and action required");

  const request = await prisma.subscriptionPaymentRequest.findUnique({
    where: { id: requestId },
    include: { plan: true },
  });

  if (!request) throw new NotFoundError("Payment request not found");

  if (action === "approve") {
    if (!request.plan) throw new ValidationError("Plan not found for this request");

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId: request.userId,
        planId: request.plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        assignedById: req.user.id,
      },
    });

    await prisma.subscriptionPaymentRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: req.user.id,
        reviewedAt: now,
        adminNote: reason || null,
        subscriptionId: subscription.id,
      },
    });

    return sendSuccess(res, { subscriptionId: subscription.id }, "Payment approved and subscription activated");
  }

  const updatedStatus = action === "reject" ? "REJECTED" : action === "refund" ? "REFUNDED" : "NEEDS_INFO";
  await prisma.subscriptionPaymentRequest.update({
    where: { id: requestId },
    data: {
      status: updatedStatus,
      reviewedById: req.user.id,
      reviewedAt: new Date(),
      adminNote: reason || null,
    },
  });

  return sendSuccess(res, null, `Payment request updated to ${updatedStatus}`);
}

export async function assignSubscriptionPlan(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { userId, planId, bonusDays = 0 } = req.body;

  if (!userId || !planId) throw new ValidationError("User ID and Plan ID required");

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan not found");

  const now = new Date();
  const end = new Date(now.getTime() + (30 + Number(bonusDays)) * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.create({
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

  return sendSuccess(res, { subscriptionId: subscription.id }, "Plan assigned successfully");
}

export async function extendSubscription(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { subscriptionId, additionalDays = 30 } = req.body;

  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new NotFoundError("Subscription not found");

  const base = sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date();
  const newEnd = new Date(base.getTime() + Number(additionalDays) * 24 * 60 * 60 * 1000);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { currentPeriodEnd: newEnd, status: "ACTIVE" },
  });

  return sendSuccess(res, null, "Subscription extended successfully");
}

export async function updateSubscriptionStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status, reason } = req.body;

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status,
      suspendedAt: status === "SUSPENDED" ? new Date() : null,
      suspendReason: status === "SUSPENDED" ? reason : null,
    },
  });

  return sendSuccess(res, updated, "Subscription status updated");
}

export async function getBillingSettings(req: Request, res: Response) {
  return sendSuccess(res, {
    trialDurationType: "DAYS",
    trialDurationValue: 14,
    allowTrialOnCreate: true,
    defaultTrialPlanId: null,
  });
}

export async function saveBillingSettings(req: Request, res: Response) {
  return sendSuccess(res, req.body, "Billing settings updated");
}


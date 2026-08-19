import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { logAudit } from "../services/audit.service";

// ────────────────────────────────────────────────────────────────────────────
// Dashboard Overview (existing, enhanced)
// ────────────────────────────────────────────────────────────────────────────

export async function getPlatformOverview(req: Request, res: Response) {
  const [
    totalUsers,
    totalMesses,
    pendingMesses,
    activeSubscriptions,
    pendingPayments,
    totalRevenue,
    recentUsers,
    recentMesses,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.mess.count({ where: { deletedAt: null } }),
    prisma.mess.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscriptionPaymentRequest.count({ where: { status: "PENDING" } }),
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
    totalMesses,
    pendingMesses,
    activeSubscriptions,
    pendingPayments,
    totalRevenue: totalRevenue._sum.amount || 0,
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
// Payment Management
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

// ────────────────────────────────────────────────────────────────────────────
// Subscriptions
// ────────────────────────────────────────────────────────────────────────────

export async function getAllSubscriptions(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (status) where.status = status;

  const [subscriptions, total, planStats] = await Promise.all([
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
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return sendList(res, subscriptions, { page, limit, total }, "Subscriptions fetched");
}

// ────────────────────────────────────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────────────────────────────────────

export async function getPlatformAnalytics(req: Request, res: Response) {
  const period = (req.query.period as string) || "month";

  // Calculate date range
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
    case "quarter":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "half_year":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
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

// ────────────────────────────────────────────────────────────────────────────
// Audit Logs
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Admin Notifications
// ────────────────────────────────────────────────────────────────────────────

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

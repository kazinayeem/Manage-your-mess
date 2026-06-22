"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/billing/auth";
import { updateSubscriptionStatus } from "@/actions/billing";
import type { UserRole, TicketStatus, TicketPriority } from "@prisma/client";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getAdminUsers(search?: string) {
  await requireSuperAdmin();
  return db.user.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { members: true, subscriptions: true } },
    },
  });
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await db.user.update({ where: { id: userId }, data: { isActive } });
    if (!isActive) {
      await db.subscription.updateMany({
        where: { userId, status: { in: ["ACTIVE", "TRIALING"] } },
        data: { status: "SUSPENDED", suspendedAt: new Date(), suspendReason: "User suspended by admin" },
      });
    }
    revalidatePath("/super-admin/users");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update user" };
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await db.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/super-admin/users");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update role" };
  }
}

// ─── Messes ──────────────────────────────────────────────────────────────────

export async function getAdminMesses(search?: string) {
  await requireSuperAdmin();
  return db.mess.findMany({
    where: {
      deletedAt: null,
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } },
      subscription: { include: { plan: true } },
      _count: { select: { members: { where: { deletedAt: null, status: "ACTIVE" } } } },
    },
  });
}

export async function suspendMess(messId: string, reason?: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const mess = await db.mess.findUnique({
      where: { id: messId },
      select: { subscriptionId: true, ownerId: true },
    });
    if (!mess) return { success: false, error: "Mess not found" };

    if (mess.subscriptionId) {
      await updateSubscriptionStatus(mess.subscriptionId, "SUSPENDED", reason);
    } else {
      const sub = await db.subscription.findFirst({
        where: { userId: mess.ownerId },
        orderBy: { createdAt: "desc" },
      });
      if (sub) await updateSubscriptionStatus(sub.id, "SUSPENDED", reason);
    }
    revalidatePath("/super-admin/messes");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to suspend mess" };
  }
}

export async function deleteMessAdmin(messId: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await db.mess.update({ where: { id: messId }, data: { deletedAt: new Date() } });
    revalidatePath("/super-admin/messes");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete mess" };
  }
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function getAdminAuditLogs(limit = 100) {
  await requireSuperAdmin();
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      mess: { select: { name: true } },
    },
  });
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

export async function getAdminCoupons() {
  await requireSuperAdmin();
  return db.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function saveCoupon(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin();
    const id = (formData.get("id") as string) || undefined;
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const discountPercent = formData.get("discountPercent")
      ? Number(formData.get("discountPercent"))
      : null;
    const discountAmount = formData.get("discountAmount")
      ? Number(formData.get("discountAmount"))
      : null;
    const maxUses = formData.get("maxUses") ? Number(formData.get("maxUses")) : null;
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

    if (!code) return { success: false, error: "Coupon code is required" };

    const data = {
      code,
      discountPercent,
      discountAmount,
      maxUses,
      isActive,
    };

    if (id) {
      const coupon = await db.coupon.update({ where: { id }, data });
      revalidatePath("/super-admin/coupons");
      return { success: true, data: { id: coupon.id } };
    }

    const coupon = await db.coupon.create({ data });
    revalidatePath("/super-admin/coupons");
    return { success: true, data: { id: coupon.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save coupon" };
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await db.coupon.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/super-admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete coupon" };
  }
}

// ─── Support Tickets ─────────────────────────────────────────────────────────

export async function getAdminSupportTickets(status?: TicketStatus) {
  await requireSuperAdmin();
  return db.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      assignee: { select: { name: true } },
    },
  });
}

export async function updateSupportTicket(
  ticketId: string,
  data: { status?: TicketStatus; priority?: TicketPriority; assigneeId?: string | null }
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...data,
        resolvedAt: data.status === "RESOLVED" || data.status === "CLOSED" ? new Date() : undefined,
      },
    });
    revalidatePath("/super-admin/support");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update ticket" };
  }
}

export async function createSupportTicket(
  subject: string,
  description: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { requireAuth } = await import("@/lib/mess-access");
    const user = await requireAuth();
    const ticket = await db.supportTicket.create({
      data: { userId: user.id, subject, description },
    });
    revalidatePath("/portal/help");
    revalidatePath("/super-admin/support");
    return { success: true, data: { id: ticket.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create ticket" };
  }
}

// ─── Referrals ───────────────────────────────────────────────────────────────

export async function getAdminReferrals() {
  await requireSuperAdmin();
  return db.referral.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      referrer: { select: { name: true, email: true } },
      referee: { select: { name: true, email: true } },
    },
  });
}

export async function broadcastNotification(
  title: string,
  message: string
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireSuperAdmin();
    const users = await db.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
    });
    await db.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "SYSTEM" as const,
        title,
        message,
        sentAt: new Date(),
      })),
    });
    revalidatePath("/super-admin/announcements");
    return { success: true, data: { count: users.length } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Broadcast failed" };
  }
}

export async function getDatabaseStats() {
  await requireSuperAdmin();
  const [users, messes, members, subscriptions, payments, auditLogs] = await Promise.all([
    db.user.count(),
    db.mess.count({ where: { deletedAt: null } }),
    db.member.count({ where: { deletedAt: null } }),
    db.subscription.count(),
    db.subscriptionPaymentRequest.count(),
    db.auditLog.count(),
  ]);
  return { users, messes, members, subscriptions, payments, auditLogs };
}

export async function getSecurityLogs(limit = 100) {
  await requireSuperAdmin();
  return db.securityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { email: true, name: true } } },
  });
}

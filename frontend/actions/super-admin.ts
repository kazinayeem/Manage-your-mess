"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiPatch, apiPost } from "@/lib/server-api";
import type { UserRole, TicketStatus, TicketPriority } from "@/types/domain";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getAdminUsers(search?: string) {
  const res = await apiGet(`/super-admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  return res.success && res.data ? res.data : [];
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const res = await apiPatch(`/super-admin/users/${userId}/status`, { isActive });
    if (res.success) {
      revalidatePath("/super-admin/users");
      return { success: true };
    }
    return { success: false, error: res.message || "Failed to update user" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update user" };
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  try {
    const res = await apiPatch(`/super-admin/users/${userId}/role`, { role });
    if (res.success) {
      revalidatePath("/super-admin/users");
      return { success: true };
    }
    return { success: false, error: res.message || "Failed to update role" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update role" };
  }
}

// ─── Messes ──────────────────────────────────────────────────────────────────

export async function getAdminMesses(search?: string) {
  const res = await apiGet(`/super-admin/messes${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  return res.success && res.data ? res.data : [];
}

export async function suspendMess(messId: string, reason?: string): Promise<ActionResult> {
  try {
    const res = await apiPatch(`/super-admin/messes/${messId}/suspend`, { reason });
    if (res.success) {
      revalidatePath("/super-admin/messes");
      return { success: true };
    }
    return { success: false, error: res.message || "Failed to suspend mess" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to suspend mess" };
  }
}

export async function deleteMessAdmin(messId: string): Promise<ActionResult> {
  try {
    const res = await apiPatch(`/super-admin/messes/${messId}/reject`, { reason: "Admin deleted mess" });
    if (res.success) {
      revalidatePath("/super-admin/messes");
      return { success: true };
    }
    return { success: false, error: res.message || "Failed to delete mess" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete mess" };
  }
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function getAdminAuditLogs(limit = 100) {
  const res = await apiGet(`/super-admin/audit-logs?limit=${limit}`);
  return res.success && res.data ? res.data : [];
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

export async function getAdminCoupons() {
  const res = await apiGet(`/super-admin/coupons`);
  return res.success && res.data ? res.data : [];
}

export async function saveCoupon(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const discountPercent = formData.get("discountPercent") ? Number(formData.get("discountPercent")) : null;
    const discountAmount = formData.get("discountAmount") ? Number(formData.get("discountAmount")) : null;
    const maxUses = formData.get("maxUses") ? Number(formData.get("maxUses")) : null;
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

    if (!code) return { success: false, error: "Coupon code is required" };

    const res = await apiPost("/super-admin/coupons", {
      code,
      discountPercent,
      discountAmount,
      maxUses,
      isActive,
    });

    if (res.success) {
      revalidatePath("/super-admin/coupons");
      return { success: true, data: { id: res.data?.id || "saved" } };
    }
    return { success: false, error: res.message || "Failed to save coupon" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save coupon" };
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    revalidatePath("/super-admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete coupon" };
  }
}

// ─── Support Tickets ─────────────────────────────────────────────────────────

export async function getAdminSupportTickets(status?: TicketStatus) {
  const res = await apiGet(`/super-admin/support${status ? `?status=${status}` : ""}`);
  return res.success && res.data ? res.data : [];
}

export async function updateSupportTicket(
  ticketId: string,
  data: { status?: TicketStatus; priority?: TicketPriority; assigneeId?: string | null }
): Promise<ActionResult> {
  try {
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
    revalidatePath("/super-admin/support");
    return { success: true, data: { id: "ticket-1" } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create ticket" };
  }
}

// ─── Referrals ───────────────────────────────────────────────────────────────

export async function getAdminReferrals() {
  const res = await apiGet(`/super-admin/referrals`);
  return res.success && res.data ? res.data : [];
}

export async function broadcastNotification(
  title: string,
  message: string
): Promise<ActionResult<{ count: number }>> {
  try {
    revalidatePath("/super-admin/announcements");
    return { success: true, data: { count: 1 } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Broadcast failed" };
  }
}

export async function getDatabaseStats() {
  const res = await apiGet(`/super-admin/database`);
  return res.success && res.data ? res.data : { users: 0, messes: 0, members: 0, subscriptions: 0, payments: 0, auditLogs: 0 };
}

export async function getSecurityLogs(limit = 100) {
  const res = await apiGet(`/super-admin/security`);
  return res.success && res.data ? res.data : [];
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/mess-access";

type ActionResult = { success: true } | { success: false; error: string };

export async function getUserNotifications() {
  const user = await requireAuth();
  return db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await db.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    revalidatePath("/portal/notifications");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/portal/notifications");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createUserNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : undefined,
      sentAt: new Date(),
    },
  });
}

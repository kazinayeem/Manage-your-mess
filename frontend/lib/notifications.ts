import { apiPost } from "@/lib/api-client";
import type { NotificationType } from "@/types/domain";

export async function createUserNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  try {
    await apiPost("/notifications", {
      userId,
      type,
      title,
      message,
      data,
    });
  } catch {
    // ignore
  }
}

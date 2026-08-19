import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getNotifications(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });

  return sendSuccess(res, { notifications, unreadCount });
}

export async function markAsRead(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { id } = req.params;

  if (id === "all") {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return sendSuccess(res, null, "All notifications marked as read");
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return sendSuccess(res, notification, "Marked as read");
}

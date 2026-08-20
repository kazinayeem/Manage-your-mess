import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError } from "../utils/errors";
import { sendSuccess } from "../utils/response";

export async function getUserAnnouncements(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");

  try {
    const reads = await prisma.announcementRead.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { announcement: true },
    });

    const items = reads.map((row) => ({
      id: row.announcement.id,
      title: row.announcement.title,
      description: row.announcement.description,
      type: row.announcement.type,
      priority: row.announcement.priority,
      startsAt: row.announcement.startsAt,
      endsAt: row.announcement.endsAt,
      publishedAt: row.announcement.publishedAt,
      isRead: row.isRead,
      readAt: row.readAt,
      targetMessIds: row.announcement.targetMessIds ? JSON.parse(row.announcement.targetMessIds) : [],
    }));

    return sendSuccess(res, items);
  } catch {
    return sendSuccess(res, []);
  }
}

export async function getActiveAnnouncementsForUser(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");

  const now = new Date();
  try {
    const reads = await prisma.announcementRead.findMany({
      where: { userId: req.user.id },
      include: { announcement: true },
    });

    const active = reads
      .map((r) => r.announcement)
      .filter((a) => {
        if (!a.isPublished) return false;
        if (a.startsAt && a.startsAt > now) return false;
        if (a.endsAt && a.endsAt < now) return false;
        return true;
      });

    return sendSuccess(res, active);
  } catch {
    return sendSuccess(res, []);
  }
}

export async function markAnnouncementRead(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const announcementId = req.params.id;

  try {
    await prisma.announcementRead.updateMany({
      where: { announcementId, userId: req.user.id },
      data: { isRead: true, readAt: new Date() },
    });
  } catch {
    // Ignore table missing errors gracefully
  }

  return sendSuccess(res, null, "Announcement marked as read");
}

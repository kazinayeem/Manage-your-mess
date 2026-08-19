"use server";

import { revalidatePath } from "next/cache";
import {
  AnnouncementAudienceType,
  AnnouncementPriority,
  AnnouncementType,
  NotificationType,
  type PlanTier,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/mess-access";
import { requireSuperAdmin } from "@/lib/billing/auth";
import { logBillingAudit } from "@/lib/billing/audit";

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

let announcementTableExistsCache: boolean | null = null;
let announcementReadTableExistsCache: boolean | null = null;

const ANNOUNCEMENTS_UNAVAILABLE_MESSAGE =
  "Announcements are not enabled on this database yet. Run `npx prisma db push` or apply migrations to create the Announcement tables.";

async function hasAnnouncementTable() {
  if (announcementTableExistsCache !== null) return announcementTableExistsCache;

  try {
    const rows = await db.$queryRawUnsafe<Array<{ exists: string | null }>>(
      `select to_regclass('public."Announcement"')::text as exists`
    );
    announcementTableExistsCache = Boolean(rows[0]?.exists);
  } catch {
    announcementTableExistsCache = false;
  }

  return announcementTableExistsCache;
}

async function hasAnnouncementReadTable() {
  if (announcementReadTableExistsCache !== null) return announcementReadTableExistsCache;

  try {
    const rows = await db.$queryRawUnsafe<Array<{ exists: string | null }>>(
      `select to_regclass('public."AnnouncementRead"')::text as exists`
    );
    announcementReadTableExistsCache = Boolean(rows[0]?.exists);
  } catch {
    announcementReadTableExistsCache = false;
  }

  return announcementReadTableExistsCache;
}

function parseTargetMessIds(raw: string | null | undefined) {
  try {
    return JSON.parse(raw || "[]") as string[];
  } catch {
    return [];
  }
}

async function resolveAnnouncementAudienceUserIds(input: {
  audienceType: AnnouncementAudienceType;
  targetMessIds: string[];
}) {
  const { audienceType, targetMessIds } = input;

  if (audienceType === "ALL_USERS") {
    const users = await db.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  if (audienceType === "ALL_MANAGERS") {
    const managers = await db.member.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        role: { in: ["MESS_MANAGER", "ASSISTANT_MANAGER", "ACCOUNTANT"] },
      },
      select: { userId: true },
    });
    return [...new Set(managers.map((row) => row.userId))];
  }

  if (audienceType === "ALL_MEMBERS") {
    const members = await db.member.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { userId: true },
    });
    return [...new Set(members.map((row) => row.userId))];
  }

  if (audienceType === "SPECIFIC_MESSES") {
    const members = await db.member.findMany({
      where: {
        messId: { in: targetMessIds },
        deletedAt: null,
        status: { in: ["ACTIVE", "PENDING"] },
      },
      select: { userId: true },
    });
    return [...new Set(members.map((row) => row.userId))];
  }

  const tierMap: Record<AnnouncementAudienceType, PlanTier> = {
    ALL_USERS: "FREE",
    ALL_MANAGERS: "FREE",
    ALL_MEMBERS: "FREE",
    FREE_PLAN_USERS: "FREE",
    PRO_PLAN_USERS: "PRO",
    BUSINESS_PLAN_USERS: "BUSINESS",
    ENTERPRISE_PLAN_USERS: "ENTERPRISE",
    SPECIFIC_MESSES: "FREE",
  };

  const subscriptions = await db.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIALING", "PENDING"] },
      plan: { tier: tierMap[audienceType] },
    },
    select: { userId: true },
    orderBy: { createdAt: "desc" },
  });

  return [...new Set(subscriptions.map((row) => row.userId))];
}

function announcementActiveWindow(announcement: {
  startsAt: Date | null;
  endsAt: Date | null;
  isPublished: boolean;
}) {
  const now = new Date();
  if (!announcement.isPublished) return false;
  if (announcement.startsAt && announcement.startsAt > now) return false;
  if (announcement.endsAt && announcement.endsAt < now) return false;
  return true;
}

export async function getAdminAnnouncements() {
  await requireSuperAdmin();
  if (!(await hasAnnouncementTable())) {
    return [];
  }
  try {
    return await db.announcement.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { reads: true } },
      },
    });
  } catch {
    return [];
  }
}

export async function saveAnnouncement(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireSuperAdmin();
    const id = (formData.get("id") as string) || undefined;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const type = ((formData.get("type") as string) || "INFORMATION") as AnnouncementType;
    const priority = ((formData.get("priority") as string) || "MEDIUM") as AnnouncementPriority;
    const audienceType = ((formData.get("audienceType") as string) || "ALL_USERS") as AnnouncementAudienceType;
    const startsAtRaw = (formData.get("startsAt") as string) || "";
    const endsAtRaw = (formData.get("endsAt") as string) || "";
    const isPublished = formData.get("isPublished") === "true" || formData.get("isPublished") === "on";
    const targetMessIds = formData.getAll("targetMessIds").map(String).filter(Boolean);

    if (!title || !description) {
      return { success: false, error: "Title and description are required" };
    }
    if (!(await hasAnnouncementTable())) {
      return { success: false, error: ANNOUNCEMENTS_UNAVAILABLE_MESSAGE };
    }

    const data = {
      title,
      description,
      type,
      priority,
      audienceType,
      targetMessIds: JSON.stringify(targetMessIds),
      startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
      isPublished,
    };

    let announcement;
    if (id) {
      const existing = await db.announcement.findUnique({ where: { id } });
      if (!existing) return { success: false, error: "Announcement not found" };

      announcement = await db.announcement.update({
        where: { id },
        data: {
          ...data,
          publishedAt: isPublished ? (existing.publishedAt ?? new Date()) : null,
        },
      });
    } else {
      announcement = await db.announcement.create({
        data: {
          ...data,
          publishedAt: isPublished ? new Date() : null,
          createdById: admin.id,
        },
      });
    }

    if (announcement.isPublished) {
      const userIds = await resolveAnnouncementAudienceUserIds({ audienceType, targetMessIds });
      const canTrackReads = await hasAnnouncementReadTable();
      if (userIds.length && canTrackReads) {
        await db.announcementRead.createMany({
          data: userIds.map((userId) => ({
            announcementId: announcement.id,
            userId,
          })),
          skipDuplicates: true,
        });

        await db.notification.createMany({
          data: userIds.map((userId) => ({
            userId,
            type: NotificationType.GLOBAL_ANNOUNCEMENT,
            title: announcement.title,
            message: announcement.description,
            data: JSON.stringify({ announcementId: announcement.id, priority: announcement.priority }),
            sentAt: new Date(),
          })),
          skipDuplicates: false,
        });
      }
    }

    await logBillingAudit({
      action: id ? "UPDATE" : "CREATE",
      entity: "Announcement",
      entityId: announcement.id,
      userId: admin.id,
      newData: announcement,
    });

    revalidatePath("/super-admin/announcements");
    revalidatePath("/portal");
    revalidatePath("/portal/announcements");
    return { success: true, data: { id: announcement.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save announcement" };
  }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();
    if (!(await hasAnnouncementTable())) {
      return { success: false, error: ANNOUNCEMENTS_UNAVAILABLE_MESSAGE };
    }

    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Announcement not found" };

    await db.announcement.delete({ where: { id } });

    await logBillingAudit({
      action: "DELETE",
      entity: "Announcement",
      entityId: id,
      userId: admin.id,
      oldData: existing,
    });

    revalidatePath("/super-admin/announcements");
    revalidatePath("/portal");
    revalidatePath("/portal/announcements");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete announcement" };
  }
}

export async function getUserAnnouncements() {
  const user = await requireAuth();
  if (!(await hasAnnouncementTable()) || !(await hasAnnouncementReadTable())) {
    return [];
  }
  let rows:
    | Array<{
        announcement: {
          id: string;
          title: string;
          description: string;
          type: AnnouncementType;
          priority: AnnouncementPriority;
          startsAt: Date | null;
          endsAt: Date | null;
          publishedAt: Date | null;
          targetMessIds: string;
        };
        isRead: boolean;
        readAt: Date | null;
      }>
    = [];

  try {
    rows = await db.announcementRead.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { announcement: true },
    });
  } catch {
    return [];
  }

  return rows.map((row) => ({
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
      targetMessIds: parseTargetMessIds(row.announcement.targetMessIds),
    }));
}

export async function getActiveAnnouncementsForUser() {
  const all = await getUserAnnouncements();
  return all.filter((item) =>
    announcementActiveWindow({
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      isPublished: true,
    })
  );
}

export async function markAnnouncementRead(announcementId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    if (!(await hasAnnouncementTable()) || !(await hasAnnouncementReadTable())) {
      return { success: true };
    }
    try {
      await db.announcementRead.updateMany({
        where: { announcementId, userId: user.id },
        data: { isRead: true, readAt: new Date() },
      });
    } catch {
      return { success: true };
    }

    await logBillingAudit({
      action: "UPDATE",
      entity: "AnnouncementRead",
      entityId: announcementId,
      userId: user.id,
      newData: { isRead: true },
    });

    revalidatePath("/portal/announcements");
    revalidatePath("/portal");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to mark announcement" };
  }
}

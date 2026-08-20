"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAnnouncements = getUserAnnouncements;
exports.getActiveAnnouncementsForUser = getActiveAnnouncementsForUser;
exports.markAnnouncementRead = markAnnouncementRead;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getUserAnnouncements(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    try {
        const reads = await database_1.prisma.announcementRead.findMany({
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
        return (0, response_1.sendSuccess)(res, items);
    }
    catch {
        return (0, response_1.sendSuccess)(res, []);
    }
}
async function getActiveAnnouncementsForUser(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const now = new Date();
    try {
        const reads = await database_1.prisma.announcementRead.findMany({
            where: { userId: req.user.id },
            include: { announcement: true },
        });
        const active = reads
            .map((r) => r.announcement)
            .filter((a) => {
            if (!a.isPublished)
                return false;
            if (a.startsAt && a.startsAt > now)
                return false;
            if (a.endsAt && a.endsAt < now)
                return false;
            return true;
        });
        return (0, response_1.sendSuccess)(res, active);
    }
    catch {
        return (0, response_1.sendSuccess)(res, []);
    }
}
async function markAnnouncementRead(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const announcementId = req.params.id;
    try {
        await database_1.prisma.announcementRead.updateMany({
            where: { announcementId, userId: req.user.id },
            data: { isRead: true, readAt: new Date() },
        });
    }
    catch {
        // Ignore table missing errors gracefully
    }
    return (0, response_1.sendSuccess)(res, null, "Announcement marked as read");
}
//# sourceMappingURL=announcement.controller.js.map
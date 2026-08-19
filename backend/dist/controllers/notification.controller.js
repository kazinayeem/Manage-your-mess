"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getNotifications(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const notifications = await database_1.prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    const unreadCount = await database_1.prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
    });
    return (0, response_1.sendSuccess)(res, { notifications, unreadCount });
}
async function markAsRead(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { id } = req.params;
    if (id === "all") {
        await database_1.prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        return (0, response_1.sendSuccess)(res, null, "All notifications marked as read");
    }
    const notification = await database_1.prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });
    return (0, response_1.sendSuccess)(res, notification, "Marked as read");
}
//# sourceMappingURL=notification.controller.js.map
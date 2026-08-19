"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserNotification = createUserNotification;
const database_1 = require("../config/database");
async function createUserNotification(userId, type, title, message, data) {
    await database_1.prisma.notification.create({
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
//# sourceMappingURL=notification.service.js.map
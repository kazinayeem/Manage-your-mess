"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const database_1 = require("../config/database");
async function logAudit(input) {
    await database_1.prisma.auditLog.create({
        data: {
            userId: input.userId ?? null,
            messId: input.messId ?? null,
            action: input.action,
            entity: input.entity,
            entityId: input.entityId ?? null,
            oldData: input.oldData ? JSON.stringify(input.oldData) : null,
            newData: input.newData ? JSON.stringify(input.newData) : null,
        },
    });
}
//# sourceMappingURL=audit.service.js.map
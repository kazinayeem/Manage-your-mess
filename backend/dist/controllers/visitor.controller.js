"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisitors = getVisitors;
exports.createVisitor = createVisitor;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getVisitors(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const visitors = await database_1.prisma.visitor.findMany({
        where: { messId },
        orderBy: { entryAt: "desc" },
    });
    return (0, response_1.sendList)(res, visitors, { total: visitors.length });
}
async function createVisitor(req, res) {
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { name, phone, purpose, entryAt } = req.body;
    if (!name)
        throw new errors_1.ValidationError("Name is required");
    const visitor = await database_1.prisma.visitor.create({
        data: {
            messId,
            name,
            phone,
            purpose,
            entryAt: entryAt ? new Date(entryAt) : new Date(),
        },
    });
    return (0, response_1.sendSuccess)(res, visitor, "Visitor logged", 201);
}
//# sourceMappingURL=visitor.controller.js.map
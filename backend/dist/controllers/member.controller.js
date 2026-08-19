"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMembers = getMembers;
exports.getMemberById = getMemberById;
exports.updateMemberStatus = updateMemberStatus;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getMembers(req, res) {
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID is required");
    const members = await database_1.prisma.member.findMany({
        where: { messId, deletedAt: null },
        include: {
            user: {
                select: { id: true, name: true, email: true, phone: true, image: true },
            },
            bed: {
                include: { room: { select: { number: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return (0, response_1.sendList)(res, members, { total: members.length });
}
async function getMemberById(req, res) {
    const member = await database_1.prisma.member.findUnique({
        where: { id: req.params.id },
        include: {
            user: { select: { id: true, name: true, email: true, phone: true, image: true } },
            mess: { select: { id: true, name: true } },
            bed: { include: { room: true } },
            deposits: { take: 5, orderBy: { createdAt: "desc" } },
        },
    });
    if (!member || member.deletedAt)
        throw new errors_1.NotFoundError("Member not found");
    return (0, response_1.sendSuccess)(res, member);
}
async function updateMemberStatus(req, res) {
    const { id } = req.params;
    const { status, role } = req.body;
    const member = await database_1.prisma.member.update({
        where: { id },
        data: {
            ...(status && { status }),
            ...(role && { role }),
        },
        include: { user: true },
    });
    return (0, response_1.sendSuccess)(res, member, "Member status updated");
}
//# sourceMappingURL=member.controller.js.map
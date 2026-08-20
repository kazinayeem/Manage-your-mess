"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMembers = getMembers;
exports.getMemberById = getMemberById;
exports.updateMember = updateMember;
exports.updateMemberStatus = updateMemberStatus;
exports.removeMember = removeMember;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const access_service_1 = require("../services/access.service");
async function getMembers(req, res) {
    const messId = req.params.messId || req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID is required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MEMBER_READ");
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
    const memberId = req.params.id;
    const member = await database_1.prisma.member.findUnique({
        where: { id: memberId },
        include: {
            user: { select: { id: true, name: true, email: true, phone: true, image: true } },
            mess: { select: { id: true, name: true, ownerId: true, managerId: true } },
            bed: { include: { room: true } },
            deposits: { where: { deletedAt: null }, take: 10, orderBy: { createdAt: "desc" } },
        },
    });
    if (!member || member.deletedAt)
        throw new errors_1.NotFoundError("Member not found");
    await (0, access_service_1.requireMessAccess)(req.user, member.messId, "MEMBER_READ");
    return (0, response_1.sendSuccess)(res, member);
}
async function updateMember(req, res) {
    const memberId = req.params.id;
    const member = await database_1.prisma.member.findUnique({
        where: { id: memberId },
        include: { mess: true },
    });
    if (!member || member.deletedAt)
        throw new errors_1.NotFoundError("Member not found");
    const access = await (0, access_service_1.requireMessAccess)(req.user, member.messId, "MEMBER_UPDATE");
    // If user is not manager/owner, they can only edit their own profile
    const isManagerOrOwner = access.role === "MESS_MANAGER" || access.role === "MESS_OWNER";
    if (!isManagerOrOwner && member.userId !== req.user.id) {
        throw new errors_1.ForbiddenError("You can only edit your own profile");
    }
    const { fullName, phone, nid, bloodGroup, address, occupation, university, monthlyDeposit } = req.body;
    const updated = await database_1.prisma.$transaction(async (tx) => {
        const updatedMember = await tx.member.update({
            where: { id: memberId },
            data: {
                ...(fullName !== undefined && { fullName }),
                ...(phone !== undefined && { phone }),
                ...(nid !== undefined && { nid }),
                ...(bloodGroup !== undefined && { bloodGroup }),
                ...(address !== undefined && { address }),
                ...(occupation !== undefined && { occupation }),
                ...(university !== undefined && { university }),
                ...(monthlyDeposit !== undefined && isManagerOrOwner && { monthlyDeposit: Number(monthlyDeposit) }),
            },
            include: { user: true },
        });
        if (fullName || phone) {
            await tx.user.update({
                where: { id: member.userId },
                data: {
                    ...(fullName && { name: fullName }),
                    ...(phone && { phone }),
                },
            });
        }
        await tx.auditLog.create({
            data: {
                messId: member.messId,
                userId: req.user.id,
                action: "UPDATE",
                entity: "Member",
                entityId: memberId,
                newData: JSON.stringify(req.body),
            },
        });
        return updatedMember;
    });
    return (0, response_1.sendSuccess)(res, updated, "Member updated successfully");
}
async function updateMemberStatus(req, res) {
    const { id } = req.params;
    const member = await database_1.prisma.member.findUnique({ where: { id } });
    if (!member || member.deletedAt)
        throw new errors_1.NotFoundError("Member not found");
    await (0, access_service_1.requireMessAccess)(req.user, member.messId, "MEMBER_APPROVE");
    const { status, role } = req.body;
    const updated = await database_1.prisma.$transaction(async (tx) => {
        const m = await tx.member.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(role && { role }),
            },
            include: { user: true },
        });
        await tx.auditLog.create({
            data: {
                messId: member.messId,
                userId: req.user.id,
                action: status === "ACTIVE" ? "APPROVE" : "UPDATE",
                entity: "Member",
                entityId: id,
                newData: JSON.stringify({ status, role }),
            },
        });
        return m;
    });
    return (0, response_1.sendSuccess)(res, updated, "Member status updated");
}
async function removeMember(req, res) {
    const { id } = req.params;
    const member = await database_1.prisma.member.findUnique({
        where: { id },
        include: { mess: true },
    });
    if (!member || member.deletedAt)
        throw new errors_1.NotFoundError("Member not found");
    await (0, access_service_1.requireMessAccess)(req.user, member.messId, "MEMBER_BAN");
    if (member.userId === member.mess.ownerId) {
        throw new errors_1.ValidationError("Cannot remove the mess owner");
    }
    if (member.userId === member.mess.managerId) {
        throw new errors_1.ValidationError("Cannot remove the active manager. Transfer manager role first.");
    }
    await database_1.prisma.$transaction(async (tx) => {
        await tx.member.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: "LEFT",
            },
        });
        await tx.auditLog.create({
            data: {
                messId: member.messId,
                userId: req.user.id,
                action: "DELETE",
                entity: "Member",
                entityId: id,
            },
        });
    });
    return (0, response_1.sendSuccess)(res, null, "Member removed from mess successfully");
}
//# sourceMappingURL=member.controller.js.map
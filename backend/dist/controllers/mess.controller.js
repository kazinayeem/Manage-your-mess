"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyMesses = getMyMesses;
exports.createMess = createMess;
exports.joinMess = joinMess;
exports.getMessDetails = getMessDetails;
exports.updateMess = updateMess;
exports.deleteMess = deleteMess;
exports.switchActiveMess = switchActiveMess;
exports.regenerateInviteCode = regenerateInviteCode;
exports.changeManager = changeManager;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const cookies_1 = require("../utils/cookies");
const access_service_1 = require("../services/access.service");
async function getMyMesses(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const members = await database_1.prisma.member.findMany({
        where: { userId: req.user.id, deletedAt: null },
        include: {
            mess: {
                include: {
                    _count: {
                        select: { members: { where: { deletedAt: null } }, rooms: { where: { deletedAt: null } } },
                    },
                    currentMonth: true,
                },
            },
        },
    });
    const messes = members
        .filter((m) => m.mess && !m.mess.deletedAt)
        .map((m) => ({
        ...m.mess,
        memberRole: m.role,
        memberStatus: m.status,
        memberCount: m.mess._count.members,
        roomCount: m.mess._count.rooms,
    }));
    return (0, response_1.sendList)(res, messes, { total: messes.length }, "User messes retrieved");
}
async function createMess(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { name, description, address, monthlyRules } = req.body;
    if (!name)
        throw new errors_1.ValidationError("Mess name is required");
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
    const mess = await database_1.prisma.$transaction(async (tx) => {
        const createdMess = await tx.mess.create({
            data: {
                name,
                slug,
                description,
                address,
                monthlyRules: monthlyRules ? (typeof monthlyRules === "string" ? monthlyRules : JSON.stringify(monthlyRules)) : null,
                ownerId: req.user.id,
                managerId: req.user.id,
            },
        });
        await tx.member.create({
            data: {
                messId: createdMess.id,
                userId: req.user.id,
                role: "MESS_MANAGER",
                status: "ACTIVE",
                fullName: req.user.name || "Manager",
            },
        });
        // Create current active month
        const now = new Date();
        const month = await tx.messMonth.create({
            data: {
                messId: createdMess.id,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                label: now.toLocaleString("default", { month: "long", year: "numeric" }),
                status: "ACTIVE",
            },
        });
        await tx.mess.update({
            where: { id: createdMess.id },
            data: { currentMonthId: month.id },
        });
        // Default expense categories
        const defaultCategories = [
            { name: "Rent", isMealCost: false },
            { name: "Electricity", isMealCost: false },
            { name: "Water", isMealCost: false },
            { name: "Gas", isMealCost: false },
            { name: "Internet", isMealCost: false },
            { name: "Grocery", isMealCost: true },
            { name: "Cleaner", isMealCost: false },
            { name: "Maintenance", isMealCost: false },
            { name: "Emergency", isMealCost: false },
            { name: "Other", isMealCost: false },
        ];
        await tx.expenseCategory.createMany({
            data: defaultCategories.map((c) => ({
                messId: createdMess.id,
                name: c.name,
                isDefault: true,
                isMealCost: c.isMealCost,
            })),
        });
        await tx.auditLog.create({
            data: {
                messId: createdMess.id,
                userId: req.user.id,
                action: "CREATE",
                entity: "Mess",
                entityId: createdMess.id,
            },
        });
        return createdMess;
    });
    (0, cookies_1.setActiveMessCookie)(res, mess.id);
    return (0, response_1.sendSuccess)(res, mess, "Mess created successfully", 201);
}
async function joinMess(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { inviteCode } = req.body;
    if (!inviteCode)
        throw new errors_1.ValidationError("Invite code is required");
    const mess = await database_1.prisma.mess.findUnique({
        where: { inviteCode: inviteCode.trim() },
    });
    if (!mess || mess.deletedAt) {
        throw new errors_1.NotFoundError("Invalid mess invite code");
    }
    const existingMember = await database_1.prisma.member.findUnique({
        where: { messId_userId: { messId: mess.id, userId: req.user.id } },
    });
    if (existingMember) {
        if (existingMember.deletedAt) {
            await database_1.prisma.member.update({
                where: { id: existingMember.id },
                data: { deletedAt: null, status: "PENDING" },
            });
            return (0, response_1.sendSuccess)(res, mess, "Re-joined mess, pending approval");
        }
        throw new errors_1.ValidationError("You are already a member of this mess");
    }
    const member = await database_1.prisma.member.create({
        data: {
            messId: mess.id,
            userId: req.user.id,
            role: "MEMBER",
            status: "PENDING",
            fullName: req.user.name,
        },
    });
    return (0, response_1.sendSuccess)(res, { mess, member }, "Join request sent successfully");
}
async function getMessDetails(req, res) {
    const messId = req.params.id || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const access = await (0, access_service_1.requireMessAccess)(req.user, messId);
    const mess = await database_1.prisma.mess.findUnique({
        where: { id: messId },
        include: {
            owner: { select: { id: true, name: true, email: true, phone: true } },
            manager: { select: { id: true, name: true, email: true, phone: true } },
            currentMonth: true,
            _count: {
                select: {
                    members: { where: { deletedAt: null } },
                    rooms: { where: { deletedAt: null } },
                    meals: true,
                    expenses: { where: { deletedAt: null } },
                },
            },
        },
    });
    if (!mess || mess.deletedAt)
        throw new errors_1.NotFoundError("Mess not found");
    return (0, response_1.sendSuccess)(res, { ...mess, userRole: access.role, userMember: access.member });
}
async function updateMess(req, res) {
    const messId = req.params.id || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MESS_UPDATE");
    const { name, description, address, monthlyRules } = req.body;
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    if (address !== undefined)
        updateData.address = address;
    if (monthlyRules !== undefined) {
        updateData.monthlyRules = typeof monthlyRules === "string" ? monthlyRules : JSON.stringify(monthlyRules);
    }
    const updated = await database_1.prisma.mess.update({
        where: { id: messId },
        data: updateData,
    });
    await database_1.prisma.auditLog.create({
        data: {
            messId,
            userId: req.user.id,
            action: "UPDATE",
            entity: "Mess",
            entityId: messId,
            newData: JSON.stringify(updateData),
        },
    });
    return (0, response_1.sendSuccess)(res, updated, "Mess updated successfully");
}
async function deleteMess(req, res) {
    const messId = req.params.id || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MESS_DELETE");
    const mess = await database_1.prisma.mess.findFirst({
        where: { id: messId, deletedAt: null },
    });
    if (!mess)
        throw new errors_1.NotFoundError("Mess not found");
    await database_1.prisma.mess.update({
        where: { id: messId },
        data: {
            deletedAt: new Date(),
            status: "ARCHIVED",
        },
    });
    await database_1.prisma.auditLog.create({
        data: {
            messId,
            userId: req.user.id,
            action: "DELETE",
            entity: "Mess",
            entityId: messId,
        },
    });
    return (0, response_1.sendSuccess)(res, null, "Mess archived successfully");
}
async function switchActiveMess(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { messId } = req.body;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const membership = await database_1.prisma.member.findUnique({
        where: { messId_userId: { messId, userId: req.user.id } },
    });
    if (!membership || membership.deletedAt) {
        throw new errors_1.ValidationError("You are not a member of this mess");
    }
    (0, cookies_1.setActiveMessCookie)(res, messId);
    return (0, response_1.sendSuccess)(res, { messId }, "Active mess switched");
}
async function regenerateInviteCode(req, res) {
    const messId = req.params.id || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MEMBER_INVITE");
    const inviteCode = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const mess = await database_1.prisma.mess.update({
        where: { id: messId },
        data: { inviteCode },
    });
    return (0, response_1.sendSuccess)(res, { inviteCode: mess.inviteCode }, "Invite code regenerated");
}
async function changeManager(req, res) {
    const messId = req.params.id || req.activeMessId;
    const { memberId } = req.body;
    if (!messId || !memberId)
        throw new errors_1.ValidationError("Mess ID and Member ID required");
    const { mess } = await (0, access_service_1.requireMessManager)(req.user, messId);
    const target = await database_1.prisma.member.findFirst({
        where: { id: memberId, messId, deletedAt: null, status: "ACTIVE" },
    });
    if (!target)
        throw new errors_1.NotFoundError("Member not found or not active");
    if (target.userId === mess.managerId) {
        throw new errors_1.ValidationError("This member is already the manager");
    }
    const oldManagerUserId = mess.managerId;
    await database_1.prisma.$transaction(async (tx) => {
        await tx.mess.update({
            where: { id: messId },
            data: { managerId: target.userId },
        });
        await tx.member.update({
            where: { id: memberId },
            data: { role: "MESS_MANAGER" },
        });
        if (oldManagerUserId) {
            await tx.member.updateMany({
                where: { messId, userId: oldManagerUserId },
                data: { role: "MEMBER" },
            });
        }
        await tx.auditLog.create({
            data: {
                messId,
                userId: req.user.id,
                action: "TRANSFER",
                entity: "Manager",
                entityId: memberId,
                oldData: JSON.stringify({ managerUserId: oldManagerUserId }),
                newData: JSON.stringify({ managerUserId: target.userId }),
            },
        });
    });
    return (0, response_1.sendSuccess)(res, null, "Manager changed successfully");
}
//# sourceMappingURL=mess.controller.js.map
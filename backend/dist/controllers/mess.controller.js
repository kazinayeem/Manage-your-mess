"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyMesses = getMyMesses;
exports.createMess = createMess;
exports.joinMess = joinMess;
exports.getMessDetails = getMessDetails;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const cookies_1 = require("../utils/cookies");
async function getMyMesses(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const members = await database_1.prisma.member.findMany({
        where: { userId: req.user.id, deletedAt: null },
        include: {
            mess: {
                include: {
                    _count: {
                        select: { members: true, rooms: true },
                    },
                },
            },
        },
    });
    const messes = members.map((m) => ({
        ...m.mess,
        role: m.role,
        status: m.status,
        memberCount: m.mess._count.members,
        roomCount: m.mess._count.rooms,
    }));
    return (0, response_1.sendList)(res, messes, { total: messes.length }, "User messes retrieved");
}
async function createMess(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { name, description, address } = req.body;
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
                ownerId: req.user.id,
                managerId: req.user.id,
            },
        });
        await tx.member.create({
            data: {
                messId: createdMess.id,
                userId: req.user.id,
                role: "MESS_OWNER",
                status: "ACTIVE",
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
            },
        });
        await tx.mess.update({
            where: { id: createdMess.id },
            data: { currentMonthId: month.id },
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
        },
    });
    return (0, response_1.sendSuccess)(res, { mess, member }, "Join request sent successfully");
}
async function getMessDetails(req, res) {
    const messId = req.params.id || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const mess = await database_1.prisma.mess.findUnique({
        where: { id: messId },
        include: {
            owner: { select: { id: true, name: true, email: true, phone: true } },
            manager: { select: { id: true, name: true, email: true, phone: true } },
            currentMonth: true,
            _count: {
                select: { members: true, rooms: true, meals: true, expenses: true },
            },
        },
    });
    if (!mess || mess.deletedAt)
        throw new errors_1.NotFoundError("Mess not found");
    return (0, response_1.sendSuccess)(res, mess);
}
//# sourceMappingURL=mess.controller.js.map
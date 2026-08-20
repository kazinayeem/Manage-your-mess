"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvitation = createInvitation;
exports.getMessInvitations = getMessInvitations;
exports.cancelInvitation = cancelInvitation;
exports.getInvitationByToken = getInvitationByToken;
exports.acceptInvitation = acceptInvitation;
exports.rejectInvitation = rejectInvitation;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const access_service_1 = require("../services/access.service");
async function createInvitation(req, res) {
    const messId = req.params.messId || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID is required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MEMBER_INVITE");
    const { email, role } = req.body;
    if (!email)
        throw new errors_1.ValidationError("Email is required for invitation");
    const normalizedEmail = email.toLowerCase().trim();
    // Check if already an active member
    const existingUser = await database_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
            members: {
                where: { messId, deletedAt: null, status: { in: ["ACTIVE", "PENDING"] } },
            },
        },
    });
    if (existingUser && existingUser.members.length > 0) {
        throw new errors_1.ValidationError("User is already a member of this mess");
    }
    // Check for pending invitation
    const existingInv = await database_1.prisma.messInvitation.findFirst({
        where: {
            messId,
            email: normalizedEmail,
            status: "PENDING",
            expiresAt: { gt: new Date() },
        },
    });
    if (existingInv) {
        return (0, response_1.sendSuccess)(res, existingInv, "Pending invitation already exists");
    }
    const token = crypto_1.default.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitation = await database_1.prisma.messInvitation.create({
        data: {
            messId,
            email: normalizedEmail,
            token,
            role: role || "MEMBER",
            status: "PENDING",
            invitedById: req.user.id,
            expiresAt,
        },
    });
    await database_1.prisma.auditLog.create({
        data: {
            messId,
            userId: req.user.id,
            action: "CREATE",
            entity: "MessInvitation",
            entityId: invitation.id,
            newData: JSON.stringify({ email: normalizedEmail, role }),
        },
    });
    return (0, response_1.sendSuccess)(res, invitation, "Invitation created successfully", 201);
}
async function getMessInvitations(req, res) {
    const messId = req.params.messId || req.activeMessId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID is required");
    await (0, access_service_1.requireMessAccess)(req.user, messId, "MEMBER_READ");
    const invitations = await database_1.prisma.messInvitation.findMany({
        where: { messId },
        include: { invitedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
    });
    return (0, response_1.sendList)(res, invitations, { total: invitations.length });
}
async function cancelInvitation(req, res) {
    const { id } = req.params;
    const invitation = await database_1.prisma.messInvitation.findUnique({ where: { id } });
    if (!invitation)
        throw new errors_1.NotFoundError("Invitation not found");
    await (0, access_service_1.requireMessAccess)(req.user, invitation.messId, "MEMBER_INVITE");
    await database_1.prisma.messInvitation.update({
        where: { id },
        data: { status: "EXPIRED" },
    });
    return (0, response_1.sendSuccess)(res, null, "Invitation cancelled");
}
async function getInvitationByToken(req, res) {
    const { token } = req.params;
    const invitation = await database_1.prisma.messInvitation.findUnique({
        where: { token },
        include: {
            mess: { select: { id: true, name: true, description: true, logo: true, address: true } },
            invitedBy: { select: { name: true, email: true } },
        },
    });
    if (!invitation)
        throw new errors_1.NotFoundError("Invalid invitation token");
    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
        throw new errors_1.ValidationError("Invitation is expired or already processed");
    }
    return (0, response_1.sendSuccess)(res, invitation);
}
async function acceptInvitation(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Please log in to accept the invitation");
    const { token } = req.params;
    const invitation = await database_1.prisma.messInvitation.findUnique({
        where: { token },
        include: { mess: true },
    });
    if (!invitation)
        throw new errors_1.NotFoundError("Invalid invitation token");
    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
        throw new errors_1.ValidationError("Invitation is expired or already processed");
    }
    const existingMember = await database_1.prisma.member.findUnique({
        where: { messId_userId: { messId: invitation.messId, userId: req.user.id } },
    });
    if (existingMember && !existingMember.deletedAt && existingMember.status === "ACTIVE") {
        throw new errors_1.ValidationError("You are already an active member of this mess");
    }
    const member = await database_1.prisma.$transaction(async (tx) => {
        let m;
        if (existingMember) {
            m = await tx.member.update({
                where: { id: existingMember.id },
                data: {
                    deletedAt: null,
                    status: "ACTIVE",
                    role: invitation.role,
                },
            });
        }
        else {
            m = await tx.member.create({
                data: {
                    messId: invitation.messId,
                    userId: req.user.id,
                    role: invitation.role,
                    status: "ACTIVE",
                    fullName: req.user.name,
                },
            });
        }
        await tx.messInvitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED", acceptedAt: new Date() },
        });
        await tx.auditLog.create({
            data: {
                messId: invitation.messId,
                userId: req.user.id,
                action: "APPROVE",
                entity: "Member",
                entityId: m.id,
            },
        });
        return m;
    });
    return (0, response_1.sendSuccess)(res, { member, mess: invitation.mess }, "Joined mess successfully");
}
async function rejectInvitation(req, res) {
    const { token } = req.params;
    const invitation = await database_1.prisma.messInvitation.findUnique({ where: { token } });
    if (!invitation)
        throw new errors_1.NotFoundError("Invalid invitation token");
    await database_1.prisma.messInvitation.update({
        where: { id: invitation.id },
        data: { status: "REJECTED" },
    });
    return (0, response_1.sendSuccess)(res, null, "Invitation rejected");
}
//# sourceMappingURL=invitation.controller.js.map
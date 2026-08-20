import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError, ForbiddenError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { requireMessAccess } from "../services/access.service";

export async function createInvitation(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId;
  if (!messId) throw new ValidationError("Mess ID is required");

  await requireMessAccess(req.user!, messId, "MEMBER_INVITE");

  const { email, role } = req.body;
  if (!email) throw new ValidationError("Email is required for invitation");

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already an active member
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      members: {
        where: { messId, deletedAt: null, status: { in: ["ACTIVE", "PENDING"] } },
      },
    },
  });

  if (existingUser && existingUser.members.length > 0) {
    throw new ValidationError("User is already a member of this mess");
  }

  // Check for pending invitation
  const existingInv = await prisma.messInvitation.findFirst({
    where: {
      messId,
      email: normalizedEmail,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInv) {
    return sendSuccess(res, existingInv, "Pending invitation already exists");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.messInvitation.create({
    data: {
      messId,
      email: normalizedEmail,
      token,
      role: role || "MEMBER",
      status: "PENDING",
      invitedById: req.user!.id,
      expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      messId,
      userId: req.user!.id,
      action: "CREATE",
      entity: "MessInvitation",
      entityId: invitation.id,
      newData: JSON.stringify({ email: normalizedEmail, role }),
    },
  });

  return sendSuccess(res, invitation, "Invitation created successfully", 201);
}

export async function getMessInvitations(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId;
  if (!messId) throw new ValidationError("Mess ID is required");

  await requireMessAccess(req.user!, messId, "MEMBER_READ");

  const invitations = await prisma.messInvitation.findMany({
    where: { messId },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return sendList(res, invitations, { total: invitations.length });
}

export async function cancelInvitation(req: Request, res: Response) {
  const { id } = req.params;
  const invitation = await prisma.messInvitation.findUnique({ where: { id } });
  if (!invitation) throw new NotFoundError("Invitation not found");

  await requireMessAccess(req.user!, invitation.messId, "MEMBER_INVITE");

  await prisma.messInvitation.update({
    where: { id },
    data: { status: "EXPIRED" },
  });

  return sendSuccess(res, null, "Invitation cancelled");
}

export async function getInvitationByToken(req: Request, res: Response) {
  const { token } = req.params;
  const invitation = await prisma.messInvitation.findUnique({
    where: { token },
    include: {
      mess: { select: { id: true, name: true, description: true, logo: true, address: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) throw new NotFoundError("Invalid invitation token");
  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new ValidationError("Invitation is expired or already processed");
  }

  return sendSuccess(res, invitation);
}

export async function acceptInvitation(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Please log in to accept the invitation");

  const { token } = req.params;
  const invitation = await prisma.messInvitation.findUnique({
    where: { token },
    include: { mess: true },
  });

  if (!invitation) throw new NotFoundError("Invalid invitation token");
  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new ValidationError("Invitation is expired or already processed");
  }

  const existingMember = await prisma.member.findUnique({
    where: { messId_userId: { messId: invitation.messId, userId: req.user.id } },
  });

  if (existingMember && !existingMember.deletedAt && existingMember.status === "ACTIVE") {
    throw new ValidationError("You are already an active member of this mess");
  }

  const member = await prisma.$transaction(async (tx) => {
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
    } else {
      m = await tx.member.create({
        data: {
          messId: invitation.messId,
          userId: req.user!.id,
          role: invitation.role,
          status: "ACTIVE",
          fullName: req.user!.name,
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
        userId: req.user!.id,
        action: "APPROVE",
        entity: "Member",
        entityId: m.id,
      },
    });

    return m;
  });

  return sendSuccess(res, { member, mess: invitation.mess }, "Joined mess successfully");
}

export async function rejectInvitation(req: Request, res: Response) {
  const { token } = req.params;
  const invitation = await prisma.messInvitation.findUnique({ where: { token } });
  if (!invitation) throw new NotFoundError("Invalid invitation token");

  await prisma.messInvitation.update({
    where: { id: invitation.id },
    data: { status: "REJECTED" },
  });

  return sendSuccess(res, null, "Invitation rejected");
}

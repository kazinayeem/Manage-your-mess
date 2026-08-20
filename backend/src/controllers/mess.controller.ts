import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { setActiveMessCookie } from "../utils/cookies";

export async function getMyMesses(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");

  const members = await prisma.member.findMany({
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

  return sendList(res, messes, { total: messes.length }, "User messes retrieved");
}

export async function createMess(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { name, description, address } = req.body;

  if (!name) throw new ValidationError("Mess name is required");

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);

  const mess = await prisma.$transaction(async (tx) => {
    const createdMess = await tx.mess.create({
      data: {
        name,
        slug,
        description,
        address,
        ownerId: req.user!.id,
        managerId: req.user!.id,
      },
    });

    await tx.member.create({
      data: {
        messId: createdMess.id,
        userId: req.user!.id,
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

  setActiveMessCookie(res, mess.id);
  return sendSuccess(res, mess, "Mess created successfully", 201);
}

export async function joinMess(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { inviteCode } = req.body;

  if (!inviteCode) throw new ValidationError("Invite code is required");

  const mess = await prisma.mess.findUnique({
    where: { inviteCode: inviteCode.trim() },
  });

  if (!mess || mess.deletedAt) {
    throw new NotFoundError("Invalid mess invite code");
  }

  const existingMember = await prisma.member.findUnique({
    where: { messId_userId: { messId: mess.id, userId: req.user.id } },
  });

  if (existingMember) {
    if (existingMember.deletedAt) {
      await prisma.member.update({
        where: { id: existingMember.id },
        data: { deletedAt: null, status: "PENDING" },
      });
      return sendSuccess(res, mess, "Re-joined mess, pending approval");
    }
    throw new ValidationError("You are already a member of this mess");
  }

  const member = await prisma.member.create({
    data: {
      messId: mess.id,
      userId: req.user.id,
      role: "MEMBER",
      status: "PENDING",
    },
  });

  return sendSuccess(res, { mess, member }, "Join request sent successfully");
}

export async function getMessDetails(req: Request, res: Response) {
  const messId = req.params.id || req.activeMessId;
  if (!messId) throw new ValidationError("Mess ID required");

  const mess = await prisma.mess.findUnique({
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

  if (!mess || mess.deletedAt) throw new NotFoundError("Mess not found");
  return sendSuccess(res, mess);
}

export async function switchActiveMess(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { messId } = req.body;
  if (!messId) throw new ValidationError("Mess ID required");

  const membership = await prisma.member.findUnique({
    where: { messId_userId: { messId, userId: req.user.id } },
  });
  if (!membership || membership.deletedAt) {
    throw new ValidationError("You are not a member of this mess");
  }

  setActiveMessCookie(res, messId);
  return sendSuccess(res, { messId }, "Active mess switched");
}

export async function regenerateInviteCode(req: Request, res: Response) {
  const messId = req.params.id || req.activeMessId;
  if (!messId) throw new ValidationError("Mess ID required");

  const inviteCode = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const mess = await prisma.mess.update({
    where: { id: messId },
    data: { inviteCode },
  });

  return sendSuccess(res, { inviteCode: mess.inviteCode }, "Invite code regenerated");
}

export async function changeManager(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.params.id || req.activeMessId;
  const { memberId } = req.body;
  if (!messId || !memberId) throw new ValidationError("Mess ID and Member ID required");

  const target = await prisma.member.findFirst({
    where: { id: memberId, messId, deletedAt: null, status: "ACTIVE" },
  });
  if (!target) throw new NotFoundError("Member not found");

  await prisma.mess.update({
    where: { id: messId },
    data: { managerId: target.userId },
  });

  await prisma.member.update({
    where: { id: memberId },
    data: { role: "MESS_MANAGER" },
  });

  return sendSuccess(res, null, "Manager changed successfully");
}


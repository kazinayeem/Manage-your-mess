import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";
import { requireMessAccess, requireMessManager } from "../services/access.service";

export async function getMembers(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID is required");

  await requireMessAccess(req.user!, messId, "MEMBER_READ");

  const members = await prisma.member.findMany({
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

  return sendList(res, members, { total: members.length });
}

export async function getMemberById(req: Request, res: Response) {
  const memberId = req.params.id;
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, image: true } },
      mess: { select: { id: true, name: true, ownerId: true, managerId: true } },
      bed: { include: { room: true } },
      deposits: { where: { deletedAt: null }, take: 10, orderBy: { createdAt: "desc" } },
    },
  });

  if (!member || member.deletedAt) throw new NotFoundError("Member not found");

  await requireMessAccess(req.user!, member.messId, "MEMBER_READ");

  return sendSuccess(res, member);
}

export async function updateMember(req: Request, res: Response) {
  const memberId = req.params.id;
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { mess: true },
  });

  if (!member || member.deletedAt) throw new NotFoundError("Member not found");

  const access = await requireMessAccess(req.user!, member.messId, "MEMBER_UPDATE");

  // If user is not manager/owner, they can only edit their own profile
  const isManagerOrOwner = access.role === "MESS_MANAGER" || access.role === "MESS_OWNER";
  if (!isManagerOrOwner && member.userId !== req.user!.id) {
    throw new ForbiddenError("You can only edit your own profile");
  }

  const { fullName, phone, nid, bloodGroup, address, occupation, university, monthlyDeposit } = req.body;

  const updated = await prisma.$transaction(async (tx) => {
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
        userId: req.user!.id,
        action: "UPDATE",
        entity: "Member",
        entityId: memberId,
        newData: JSON.stringify(req.body),
      },
    });

    return updatedMember;
  });

  return sendSuccess(res, updated, "Member updated successfully");
}

export async function updateMemberStatus(req: Request, res: Response) {
  const { id } = req.params;
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member || member.deletedAt) throw new NotFoundError("Member not found");

  await requireMessAccess(req.user!, member.messId, "MEMBER_APPROVE");

  const { status, role } = req.body;

  const updated = await prisma.$transaction(async (tx) => {
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
        userId: req.user!.id,
        action: status === "ACTIVE" ? "APPROVE" : "UPDATE",
        entity: "Member",
        entityId: id,
        newData: JSON.stringify({ status, role }),
      },
    });

    return m;
  });

  return sendSuccess(res, updated, "Member status updated");
}

export async function removeMember(req: Request, res: Response) {
  const { id } = req.params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: { mess: true },
  });
  if (!member || member.deletedAt) throw new NotFoundError("Member not found");

  await requireMessAccess(req.user!, member.messId, "MEMBER_BAN");

  if (member.userId === member.mess.ownerId) {
    throw new ValidationError("Cannot remove the mess owner");
  }
  if (member.userId === member.mess.managerId) {
    throw new ValidationError("Cannot remove the active manager. Transfer manager role first.");
  }

  await prisma.$transaction(async (tx) => {
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
        userId: req.user!.id,
        action: "DELETE",
        entity: "Member",
        entityId: id,
      },
    });
  });

  return sendSuccess(res, null, "Member removed from mess successfully");
}

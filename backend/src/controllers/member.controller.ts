import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getMembers(req: Request, res: Response) {
  const messId = req.params.messId || req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID is required");

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
  const member = await prisma.member.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, image: true } },
      mess: { select: { id: true, name: true } },
      bed: { include: { room: true } },
      deposits: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  if (!member || member.deletedAt) throw new NotFoundError("Member not found");
  return sendSuccess(res, member);
}

export async function updateMemberStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status, role } = req.body;

  const member = await prisma.member.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(role && { role }),
    },
    include: { user: true },
  });

  return sendSuccess(res, member, "Member status updated");
}

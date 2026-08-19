import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { ValidationError } from "../utils/errors";
import { sendSuccess, sendList } from "../utils/response";

export async function getRooms(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const rooms = await prisma.room.findMany({
    where: { messId, deletedAt: null },
    include: {
      beds: {
        include: {
          member: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  return sendList(res, rooms, { total: rooms.length });
}

export async function createRoom(req: Request, res: Response) {
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const { number, floor, capacity } = req.body;
  if (!number) throw new ValidationError("Room number required");

  const cap = Number(capacity || 1);

  const room = await prisma.room.create({
    data: {
      messId,
      number: String(number),
      floor: Number(floor || 0),
      capacity: cap,
      beds: {
        create: Array.from({ length: cap }, (_, i) => ({
          number: `Bed-${i + 1}`,
        })),
      },
    },
    include: { beds: true },
  });

  return sendSuccess(res, room, "Room created", 201);
}

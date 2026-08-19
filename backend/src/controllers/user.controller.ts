import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError } from "../utils/errors";
import { sendSuccess } from "../utils/response";

export async function updateProfile(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const { name, phone, image, locale } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(image && { image }),
      ...(locale && { locale }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      locale: true,
      role: true,
    },
  });

  return sendSuccess(res, user, "Profile updated successfully");
}

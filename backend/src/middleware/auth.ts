import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@prisma/client";
import { AuthError, ForbiddenError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/database";
import { SESSION_COOKIE_NAME } from "../config/env";
import { getActiveMessFromCookie } from "../utils/cookies";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  messId?: string;
  memberId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      activeMessId?: string;
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
      token = req.cookies[SESSION_COOKIE_NAME];
    }

    if (!token) {
      throw new AuthError("Authentication token missing");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isLocked: true,
      },
    });

    if (!user || !user.isActive || user.isLocked) {
      throw new AuthError("User account disabled or not found");
    }

    // Determine active mess from header, query, or cookie
    const messIdHeader = req.headers["x-mess-id"] as string | undefined;
    const cookieMessId = req.cookies ? getActiveMessFromCookie(req.cookies) : null;
    const activeMessId = messIdHeader || cookieMessId || undefined;

    let memberId: string | undefined;
    if (activeMessId) {
      const member = await prisma.member.findUnique({
        where: { messId_userId: { messId: activeMessId, userId: user.id } },
        select: { id: true },
      });
      if (member) {
        memberId = member.id;
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      messId: activeMessId,
      memberId,
    };
    req.activeMessId = activeMessId;

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError("Authentication required"));
    }
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Required role: ${allowedRoles.join(" or ")}`));
    }
    next();
  };
}

export function requireActiveMess(req: Request, res: Response, next: NextFunction) {
  if (!req.activeMessId) {
    return next(new ForbiddenError("Active Mess selection is required for this endpoint"));
  }
  next();
}

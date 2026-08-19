import type { NextFunction, Request, Response } from "express";
import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "../config/env";
import { prisma } from "../config/database";
import { AuthError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";
import { loadActiveUser } from "../services/access.service";
import type { SessionUser } from "../types/auth";

/**
 * Verifies the JWT access token from the httpOnly cookie (or Authorization
 * header) and attaches the active user to req.user.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      (req.cookies?.[SESSION_COOKIE_NAME] as string | undefined) ??
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      throw new AuthError("Not authenticated");
    }

    const payload = verifyAccessToken(token);
    if (!payload.sub) throw new AuthError("Invalid token");

    const dbUser = await loadActiveUser(payload.sub);
    const sessionUser: SessionUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };
    req.user = sessionUser;
    next();
  } catch (err) {
    next(err instanceof AuthError ? err : new AuthError("Invalid or expired session"));
  }
}

/**
 * Attaches the user only if a valid session exists; does not reject
 * unauthenticated requests. Useful for optional-auth endpoints.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (dbUser && !dbUser.deletedAt && dbUser.isActive) {
          req.user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          };
        }
      }
    }
  } catch {
    // ignore invalid optional session
  }
  next();
}

export { REFRESH_COOKIE_NAME };
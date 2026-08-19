import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../utils/errors";
import { hasPermission, type Permission } from "../constants/permissions";

/**
 * Role/permission gate for platform-level permissions (e.g. admin areas).
 * Mess-scoped access should use the messGuard middleware instead.
 */
export function authorize(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(new ForbiddenError("Unauthorized"));
    if (permissions.length === 0) return next();
    const allowed = permissions.some((p) => hasPermission(user.role as any, p));
    if (!allowed) return next(new ForbiddenError("Permission denied"));
    return next();
  };
}
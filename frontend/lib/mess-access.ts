import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasPermission, isAdminRole, PERMISSIONS, type Permission } from "@/lib/rbac";
import { resolveMessMemberRole } from "@/lib/mess-role";
import type { UserRole } from "@prisma/client";

const LEGACY_PLAN_SELECT = {
  id: true,
  slug: true,
  tier: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  durationType: true,
  durationValue: true,
  customExpiryDate: true,
  maxMembers: true,
  limits: true,
  features: true,
  featureToggles: true,
  isActive: true,
  isDefault: true,
  isPopular: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

async function loadActiveUser(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new AuthError("Account not found");
  if (!user.isActive) throw new AuthError("Account suspended");
  if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError("Account temporarily locked");
  }
  return user;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();
  const user = await loadActiveUser(session.user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireMessAccess(
  messId: string,
  permission?: keyof typeof PERMISSIONS,
  opts?: { allowPlatformAdmin?: boolean }
) {
  const user = await requireAuth();
  const allowPlatformAdmin = opts?.allowPlatformAdmin ?? false;

  const mess = await db.mess.findFirst({
    where: { id: messId, deletedAt: null },
    include: {
      subscription: {
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          plan: { select: LEGACY_PLAN_SELECT },
        },
      },
    },
  });
  if (!mess) throw new ForbiddenError("Mess not found");

  const member = await db.member.findFirst({
    where: { messId, userId: user.id, deletedAt: null },
  });

  const platformAdmin = isAdminRole(user.role);

  if (!member) {
    if (allowPlatformAdmin && platformAdmin) {
      const role = user.role as UserRole;
      if (permission && !hasPermission(role, PERMISSIONS[permission] as Permission)) {
        throw new ForbiddenError();
      }
      return { user, member: null, mess, role };
    }
    throw new ForbiddenError("Not a member of this mess");
  }

  if (member.status === "BANNED") throw new ForbiddenError("You are banned from this mess");
  if (member.status === "PENDING") throw new ForbiddenError("Membership pending approval");

  const role = resolveMessMemberRole(
    { userId: member.userId, role: member.role },
    { ownerId: mess.ownerId, managerId: mess.managerId }
  );

  if (permission && !hasPermission(role, PERMISSIONS[permission] as Permission)) {
    throw new ForbiddenError();
  }

  return { user, member, mess, role };
}

/** Members may only act on their own member record unless they have member management permission. */
export function assertMemberScope(
  access: Awaited<ReturnType<typeof requireMessAccess>>,
  targetMemberId: string
) {
  const canManageOthers = hasPermission(access.role, PERMISSIONS.MEMBER_UPDATE);
  if (!canManageOthers && access.member?.id !== targetMemberId) {
    throw new ForbiddenError("You can only modify your own records");
  }
}

/** Only the designated mess manager (mess.managerId) may edit or remove members. */
export async function requireMessManager(messId: string) {
  const access = await requireMessAccess(messId);
  if (!access.mess.managerId || access.mess.managerId !== access.user.id) {
    throw new ForbiddenError("Only the manager can perform this action");
  }
  return access;
}

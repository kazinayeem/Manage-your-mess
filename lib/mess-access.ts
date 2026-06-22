import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/rbac";
import { resolveMessMemberRole } from "@/lib/mess-role";
import type { UserRole } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function requireMessAccess(messId: string, permission?: keyof typeof PERMISSIONS) {
  const user = await requireAuth();
  const member = await db.member.findUnique({
    where: { messId_userId: { messId, userId: user.id } },
  });
  const mess = await db.mess.findFirst({
    where: { id: messId, deletedAt: null },
    include: { subscription: { include: { plan: true } } },
  });
  if (!mess) throw new Error("Mess not found");

  const role = member
    ? resolveMessMemberRole(
        { userId: member.userId, role: member.role },
        { ownerId: mess.ownerId, managerId: mess.managerId }
      )
    : (user.role as UserRole);

  if (permission && !hasPermission(role, PERMISSIONS[permission] as Permission)) {
    throw new Error("Permission denied");
  }
  return { user, member, mess, role };
}

/** Only the designated mess manager (mess.managerId) may edit or remove members. */
export async function requireMessManager(messId: string) {
  const access = await requireMessAccess(messId);
  if (!access.mess.managerId || access.mess.managerId !== access.user.id) {
    throw new Error("Only the manager can perform this action");
  }
  return access;
}

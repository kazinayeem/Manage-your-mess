import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { apiGet } from "@/lib/api-client";
import { hasPermission, isAdminRole, PERMISSIONS, type Permission } from "@/lib/rbac";
import { resolveMessMemberRole } from "@/lib/mess-role";
import type { UserRole } from "@/types/domain";

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

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: (session.user as any).role || "MEMBER",
  };
}

export async function requireMessAccess(
  messId: string,
  permission?: keyof typeof PERMISSIONS,
  opts?: { allowPlatformAdmin?: boolean }
) {
  const user = await requireAuth();
  const allowPlatformAdmin = opts?.allowPlatformAdmin ?? false;

  const messRes = await apiGet(`/messes/${messId}`);
  if (!messRes.success || !messRes.data) throw new ForbiddenError("Mess not found");
  const mess = messRes.data;

  const member = mess.members?.find((m: any) => m.userId === user.id);
  const platformAdmin = isAdminRole(user.role as any);

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

export function assertMemberScope(
  access: Awaited<ReturnType<typeof requireMessAccess>>,
  targetMemberId: string
) {
  const canManageOthers = hasPermission(access.role, PERMISSIONS.MEMBER_UPDATE);
  if (!canManageOthers && access.member?.id !== targetMemberId) {
    throw new ForbiddenError("You can only modify your own records");
  }
}

export async function requireMessManager(messId: string) {
  const access = await requireMessAccess(messId);
  if (!access.mess.managerId || access.mess.managerId !== access.user.id) {
    throw new ForbiddenError("Only the manager can perform this action");
  }
  return access;
}

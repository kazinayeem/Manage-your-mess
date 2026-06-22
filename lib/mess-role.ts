import type { UserRole } from "@prisma/client";

type MessRef = { ownerId: string; managerId: string | null };
type MemberRef = { userId: string; role: UserRole };

/**
 * Mess-scoped permissions:
 * - mess.managerId → full management (can change manager, add meals, etc.)
 * - mess.ownerId who is NOT manager → view-only member (legal owner, no edit access)
 * - Stale MESS_MANAGER / MESS_OWNER member roles → view-only
 */
export function resolveMessMemberRole(member: MemberRef, mess: MessRef): UserRole {
  if (mess.managerId && member.userId === mess.managerId) {
    return "MESS_MANAGER";
  }

  if (member.userId === mess.ownerId) {
    return "MEMBER";
  }

  if (
    member.role === "MESS_MANAGER" ||
    member.role === "ASSISTANT_MANAGER" ||
    member.role === "MESS_OWNER"
  ) {
    return "MEMBER";
  }

  return member.role;
}

export function isDesignatedManager(member: MemberRef, mess: MessRef): boolean {
  return Boolean(mess.managerId && member.userId === mess.managerId);
}

export function isMessOwner(member: MemberRef, mess: MessRef): boolean {
  return member.userId === mess.ownerId;
}

export function isLegalOwnerNotManager(member: MemberRef, mess: MessRef): boolean {
  return member.userId === mess.ownerId && member.userId !== mess.managerId;
}

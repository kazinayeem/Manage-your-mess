import type { UserRole } from "@prisma/client";

type RoleLabelFn = (key: string) => string;

const ROLE_KEYS: Partial<Record<UserRole, string>> = {
  MESS_OWNER: "MESS_OWNER",
  MESS_MANAGER: "MESS_MANAGER",
  ACCOUNTANT: "ACCOUNTANT",
  ASSISTANT_MANAGER: "ASSISTANT_MANAGER",
  MEMBER: "MEMBER",
};

/** Translated mess role label for server components (pass `getTranslations('roles')`). */
export function getMessDisplayRoleLabel(
  effectiveRole: UserRole,
  t: RoleLabelFn,
  opts?: { isLegalOwner?: boolean; isActiveManager?: boolean }
): string {
  if (opts?.isActiveManager) return t("manager");
  if (opts?.isLegalOwner) return t("ownerViewOnly");
  return t(ROLE_KEYS[effectiveRole] ?? "MEMBER");
}

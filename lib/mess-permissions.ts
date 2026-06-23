import type { UserRole } from "@prisma/client";

export type MessCapabilities = {
  readOnly: boolean;
  canAddMeals: boolean;
  canAddDeposits: boolean;
  canAddExpenses: boolean;
  canManageBills: boolean;
  canManageMembers: boolean;
  canStartMonth: boolean;
  canChangeManager: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canDeleteMess: boolean;
  canTransferOwnership: boolean;
  canGenerateReports: boolean;
  canViewMembers: boolean;
  canManageBazaar: boolean;
  canViewMyBazaar: boolean;
};

export function getMessCapabilities(role: UserRole): MessCapabilities {
  const owner: MessCapabilities = {
    readOnly: true,
    canAddMeals: false,
    canAddDeposits: false,
    canAddExpenses: false,
    canManageBills: false,
    canManageMembers: false,
    canStartMonth: false,
    canChangeManager: false,
    canManageSettings: false,
    canManageBilling: false,
    canDeleteMess: false,
    canTransferOwnership: false,
    canGenerateReports: true,
    canViewMembers: true,
    canManageBazaar: false,
    canViewMyBazaar: true,
  };

  const manager: MessCapabilities = {
    readOnly: false,
    canAddMeals: true,
    canAddDeposits: true,
    canAddExpenses: true,
    canManageBills: true,
    canManageMembers: true,
    canStartMonth: true,
    canChangeManager: true,
    canManageSettings: true,
    canManageBilling: false,
    canDeleteMess: false,
    canTransferOwnership: false,
    canGenerateReports: true,
    canViewMembers: true,
    canManageBazaar: true,
    canViewMyBazaar: true,
  };

  const accountant: MessCapabilities = {
    readOnly: false,
    canAddMeals: false,
    canAddDeposits: true,
    canAddExpenses: true,
    canManageBills: true,
    canManageMembers: false,
    canStartMonth: false,
    canChangeManager: false,
    canManageSettings: false,
    canManageBilling: false,
    canDeleteMess: false,
    canTransferOwnership: false,
    canGenerateReports: true,
    canViewMembers: true,
    canManageBazaar: false,
    canViewMyBazaar: true,
  };

  const assistant: MessCapabilities = {
    ...manager,
    canManageMembers: false,
    canChangeManager: false,
    canManageSettings: false,
    canManageBilling: false,
    canDeleteMess: false,
    canTransferOwnership: false,
  };

  const member: MessCapabilities = {
    readOnly: true,
    canAddMeals: false,
    canAddDeposits: false,
    canAddExpenses: false,
    canManageBills: false,
    canManageMembers: false,
    canStartMonth: false,
    canChangeManager: false,
    canManageSettings: false,
    canManageBilling: false,
    canDeleteMess: false,
    canTransferOwnership: false,
    canGenerateReports: true,
    canViewMembers: false,
    canManageBazaar: false,
    canViewMyBazaar: true,
  };

  switch (role) {
    case "MESS_OWNER":
      return owner;
    case "MESS_MANAGER":
      return manager;
    case "ACCOUNTANT":
      return accountant;
    case "ASSISTANT_MANAGER":
      return assistant;
    default:
      return member;
  }
}

export function formatMessRole(role: UserRole): string {
  const labels: Partial<Record<UserRole, string>> = {
    MESS_OWNER: "Owner",
    MESS_MANAGER: "Manager",
    ACCOUNTANT: "Accountant",
    ASSISTANT_MANAGER: "Assistant Manager",
    MEMBER: "Member",
  };
  return labels[role] ?? "Member";
}

/** User-facing label with legal-owner vs active-manager context. */
export function formatMessDisplayRole(
  effectiveRole: UserRole,
  opts?: { isLegalOwner?: boolean; isActiveManager?: boolean }
): string {
  if (opts?.isActiveManager) return "Manager";
  if (opts?.isLegalOwner) return "Owner (View only)";
  return formatMessRole(effectiveRole);
}

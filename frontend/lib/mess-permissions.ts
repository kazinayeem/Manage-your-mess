import type { UserRole } from "@prisma/client";

export type MessCapabilities = {
  readOnly: boolean;
  subscriptionLocked: boolean;
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
  canViewPricing: boolean;
  canViewSubscription: boolean;
  canUsePdfExport: boolean;
  canUseExcelExport: boolean;
  canUseCsvExport: boolean;
  canViewAnalytics: boolean;
  canUseAiAnalytics: boolean;
  canManageRooms: boolean;
  canManageBeds: boolean;
  canManageVisitors: boolean;
  canManageTasks: boolean;
  canManageNotices: boolean;
  canManageInventory: boolean;
  canUseApi: boolean;
  canUseWhiteLabel: boolean;
  canUseCustomBranding: boolean;
};

export function getMessCapabilities(role: UserRole): MessCapabilities {
  const owner: MessCapabilities = {
    readOnly: true,
    subscriptionLocked: false,
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
    canViewPricing: true,
    canViewSubscription: true,
    canUsePdfExport: true,
    canUseExcelExport: true,
    canUseCsvExport: true,
    canViewAnalytics: true,
    canUseAiAnalytics: false,
    canManageRooms: false,
    canManageBeds: false,
    canManageVisitors: false,
    canManageTasks: false,
    canManageNotices: false,
    canManageInventory: false,
    canUseApi: false,
    canUseWhiteLabel: false,
    canUseCustomBranding: false,
  };

  const manager: MessCapabilities = {
    readOnly: false,
    subscriptionLocked: false,
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
    canViewPricing: true,
    canViewSubscription: true,
    canUsePdfExport: true,
    canUseExcelExport: true,
    canUseCsvExport: true,
    canViewAnalytics: true,
    canUseAiAnalytics: true,
    canManageRooms: true,
    canManageBeds: true,
    canManageVisitors: true,
    canManageTasks: true,
    canManageNotices: true,
    canManageInventory: true,
    canUseApi: true,
    canUseWhiteLabel: true,
    canUseCustomBranding: true,
  };

  const accountant: MessCapabilities = {
    readOnly: false,
    subscriptionLocked: false,
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
    canViewPricing: true,
    canViewSubscription: true,
    canUsePdfExport: true,
    canUseExcelExport: true,
    canUseCsvExport: true,
    canViewAnalytics: true,
    canUseAiAnalytics: false,
    canManageRooms: false,
    canManageBeds: false,
    canManageVisitors: false,
    canManageTasks: false,
    canManageNotices: false,
    canManageInventory: false,
    canUseApi: false,
    canUseWhiteLabel: false,
    canUseCustomBranding: false,
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
    subscriptionLocked: false,
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
    canViewPricing: true,
    canViewSubscription: true,
    canUsePdfExport: true,
    canUseExcelExport: false,
    canUseCsvExport: false,
    canViewAnalytics: false,
    canUseAiAnalytics: false,
    canManageRooms: false,
    canManageBeds: false,
    canManageVisitors: false,
    canManageTasks: false,
    canManageNotices: false,
    canManageInventory: false,
    canUseApi: false,
    canUseWhiteLabel: false,
    canUseCustomBranding: false,
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

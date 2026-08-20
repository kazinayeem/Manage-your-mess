import { auth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api-client";
import { getActiveMessIdFromCookie } from "@/lib/active-mess";
import { getMessCapabilities, type MessCapabilities } from "@/lib/mess-permissions";
import { resolveMessMemberRole, isDesignatedManager } from "@/lib/mess-role";
import {
  getFeatureAvailability,
  getSubscriptionAccessForMess,
  type SubscriptionAccessState,
} from "@/lib/billing/subscription-access";
import type { PlanTier } from "@/lib/plans";
import type { UserRole } from "@/types/domain";

function applySubscriptionToCapabilities(
  capabilities: MessCapabilities,
  subscriptionAccess: SubscriptionAccessState
): MessCapabilities {
  const features = getFeatureAvailability(subscriptionAccess);
  const canWrite = subscriptionAccess.canWrite && !capabilities.readOnly;

  return {
    ...capabilities,
    readOnly: !canWrite,
    subscriptionLocked: !subscriptionAccess.canWrite,
    canAddMeals: capabilities.canAddMeals && features.mealManagement && canWrite,
    canAddDeposits: capabilities.canAddDeposits && features.depositManagement && canWrite,
    canAddExpenses: capabilities.canAddExpenses && features.expenseManagement && canWrite,
    canManageBills: capabilities.canManageBills && features.utilityBills && canWrite,
    canManageMembers: capabilities.canManageMembers && canWrite,
    canStartMonth: capabilities.canStartMonth && canWrite,
    canChangeManager: capabilities.canChangeManager && canWrite,
    canManageSettings: capabilities.canManageSettings && canWrite,
    canManageBilling: capabilities.canManageBilling && canWrite,
    canDeleteMess: capabilities.canDeleteMess && canWrite,
    canTransferOwnership: capabilities.canTransferOwnership && canWrite,
    canGenerateReports:
      capabilities.canGenerateReports &&
      (features.pdfReports || features.excelReports || features.csvExport),
    canViewMembers: capabilities.canViewMembers,
    canManageBazaar: capabilities.canManageBazaar && features.bazaarManagement && canWrite,
    canViewMyBazaar: capabilities.canViewMyBazaar && features.bazaarManagement,
    canViewPricing: true,
    canViewSubscription: true,
    canUsePdfExport: capabilities.canUsePdfExport && features.pdfReports && canWrite,
    canUseExcelExport: capabilities.canUseExcelExport && features.excelReports && canWrite,
    canUseCsvExport: capabilities.canUseCsvExport && features.csvExport && canWrite,
    canViewAnalytics: capabilities.canViewAnalytics && features.analytics,
    canUseAiAnalytics: capabilities.canUseAiAnalytics && features.aiAnalytics && canWrite,
    canManageRooms: capabilities.canManageRooms && features.roomManagement && canWrite,
    canManageBeds: capabilities.canManageBeds && features.bedManagement && canWrite,
    canManageVisitors: capabilities.canManageVisitors && features.visitorManagement && canWrite,
    canManageTasks: capabilities.canManageTasks && features.taskManagement && canWrite,
    canManageNotices: capabilities.canManageNotices && features.noticeBoard && canWrite,
    canManageInventory: capabilities.canManageInventory && features.inventory && canWrite,
    canUseApi: capabilities.canUseApi && features.apiAccess && canWrite,
    canUseWhiteLabel: capabilities.canUseWhiteLabel && features.whiteLabel,
    canUseCustomBranding: capabilities.canUseCustomBranding && features.customBranding,
  };
}

export async function getUserMemberships(userId: string) {
  const res = await apiGet("/messes");
  if (!res.success || !res.data) return [];
  return res.data;
}

export type MessContext = NonNullable<Awaited<ReturnType<typeof getMessContextById>>>;

function buildMessContext(
  userId: string,
  platformRole: UserRole,
  messDetails: any,
  allMesses: any[],
  subscriptionAccess: SubscriptionAccessState
) {
  const planTier = (messDetails.subscription?.plan?.tier ?? "FREE") as PlanTier;
  const isOwner = messDetails.ownerId === userId;
  const userMember = messDetails.members?.find((m: any) => m.userId === userId) || {
    userId,
    role: messDetails.role || (isOwner ? "MESS_OWNER" : "MEMBER"),
  };
  const effectiveRole = resolveMessMemberRole(
    { userId, role: userMember.role },
    { ownerId: messDetails.ownerId, managerId: messDetails.managerId }
  );
  const isManager = isDesignatedManager(
    { userId, role: userMember.role },
    { ownerId: messDetails.ownerId, managerId: messDetails.managerId }
  );
  const roleCapabilities = getMessCapabilities(effectiveRole);
  const capabilities = applySubscriptionToCapabilities(roleCapabilities, subscriptionAccess);

  return {
    userId,
    userRole: platformRole,
    member: userMember,
    mess: messDetails,
    messId: messDetails.id,
    planTier,
    currentMonth: messDetails.currentMonth,
    isOwner,
    isManager,
    effectiveRole,
    capabilities,
    subscriptionAccess,
    canManageInvite: isManager && subscriptionAccess.canWrite,
    allMesses: allMesses.map((m) => ({
      messId: m.id || m.messId,
      name: m.name,
      role: m.role || (m.ownerId === userId ? "MESS_OWNER" : "MEMBER"),
      status: m.status || "ACTIVE",
      inviteCode: m.inviteCode,
      isOwner: m.ownerId === userId,
      isManager: m.managerId === userId,
    })),
  };
}

export async function getMessContextById(messId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [messesRes, messRes] = await Promise.all([
    apiGet("/messes"),
    apiGet(`/messes/${messId}`),
  ]);

  if (!messRes.success || !messRes.data) return null;
  const allMesses = messesRes.data || [];
  const messDetails = messRes.data;

  const subscriptionAccess = await getSubscriptionAccessForMess(messId, session.user.id);
  return buildMessContext(
    session.user.id,
    session.user.role,
    messDetails,
    allMesses,
    subscriptionAccess
  );
}

export async function getActiveMessContext() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const messesRes = await apiGet("/messes");
  if (!messesRes.success || !messesRes.data || !messesRes.data.length) return null;

  const allMesses = messesRes.data;
  const preferredId = await getActiveMessIdFromCookie();
  const selectedMess = allMesses.find((m: any) => m.id === preferredId || m.messId === preferredId) || allMesses[0];
  const messId = selectedMess.id || selectedMess.messId;

  const messRes = await apiGet(`/messes/${messId}`);
  if (!messRes.success || !messRes.data) return null;

  const subscriptionAccess = await getSubscriptionAccessForMess(messId, session.user.id);
  return buildMessContext(
    session.user.id,
    session.user.role,
    messRes.data,
    allMesses,
    subscriptionAccess
  );
}

export async function ensureCurrentMonth(messId: string) {
  const messRes = await apiGet(`/messes/${messId}`);
  if (!messRes.success || !messRes.data) throw new Error("Mess not found");
  if (messRes.data.currentMonth) return messRes.data.currentMonth;

  const startRes = await apiPost(`/messes/${messId}/start-month`, { name: "Current Month" });
  if (startRes.success && startRes.data) return startRes.data;

  const updatedMessRes = await apiGet(`/messes/${messId}`);
  return updatedMessRes.data?.currentMonth;
}

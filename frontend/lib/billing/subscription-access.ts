import { apiGet } from "@/lib/api-client";
import { planHasFeature, toParsedPlan, type ParsedPlan } from "@/lib/billing/plan-utils";
import { PLAN_FEATURES } from "@/lib/billing/constants";

export type SubscriptionAccessState = {
  canView: boolean;
  canWrite: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isUserSuspended: boolean;
  isTrial: boolean;
  status: string;
  plan: ParsedPlan | null;
  reason: string | null;
  daysRemaining: number;
  lockedMessage: string | null;
  allowedRoutePrefixes: string[];
};

type LegacySubscriptionWithPlan = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  suspendedAt: Date | null;
  suspendReason: string | null;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt?: Date | null;
  plan?: Record<string, unknown> | null;
};

function daysUntil(end: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export async function syncExpiredSubscriptions(subscriptionId?: string) {
  // Syncing is handled by backend Express server
}

export function resolveSubscriptionAccess(opts: {
  userActive: boolean;
  subscription: LegacySubscriptionWithPlan | null;
}): SubscriptionAccessState {
  const { userActive, subscription } = opts;

  if (!userActive) {
    return {
      canView: true,
      canWrite: false,
      isExpired: false,
      isSuspended: true,
      isUserSuspended: true,
      isTrial: false,
      status: "SUSPENDED",
      plan: subscription?.plan ? toParsedPlan(subscription.plan as never) : null,
      reason: "Your account has been suspended by the platform administrator.",
      daysRemaining: 0,
      lockedMessage: "Your account has been suspended by the platform administrator.",
      allowedRoutePrefixes: ["/portal/subscription", "/pricing"],
    };
  }

  if (!subscription) {
    return {
      canView: true,
      canWrite: true,
      isExpired: false,
      isSuspended: false,
      isUserSuspended: false,
      isTrial: false,
      status: "ACTIVE",
      plan: null,
      reason: null,
      daysRemaining: 0,
      lockedMessage: null,
      allowedRoutePrefixes: [],
    };
  }

  const plan = subscription.plan ? toParsedPlan(subscription.plan as never) : null;
  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const pastEnd = periodEnd <= now;
  let status = subscription.status;

  if (pastEnd && (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE")) {
    status = "EXPIRED";
  }

  const isSuspended = status === "SUSPENDED" || status === "CANCELLED";
  const isExpired = status === "EXPIRED" || pastEnd;
  const isPending = status === "PENDING";
  const isTrial = status === "TRIALING";

  const canWrite =
    !isSuspended &&
    !isExpired &&
    !isPending &&
    (status === "ACTIVE" || status === "TRIALING") &&
    !pastEnd;

  let reason: string | null = null;
  if (isSuspended) {
    reason =
      subscription.suspendReason ??
      "This account has been suspended by the platform administrator.";
  } else if (isExpired) {
    reason = "Your subscription has expired. Please renew to continue managing your mess.";
  } else if (isPending) {
    reason = "Your subscription is pending activation.";
  }

  const lockedMessage = isExpired
    ? "Your subscription has expired. Please renew your plan."
    : isPending
      ? "Please wait. Your payment is under review. Super Admin will verify and activate your subscription soon."
      : isSuspended
        ? reason
        : isTrial
          ? `Your trial expires in ${daysUntil(subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : periodEnd)} days`
          : null;

  return {
    canView: true,
    canWrite,
    isExpired,
    isSuspended,
    isUserSuspended: false,
    isTrial,
    status,
    plan,
    reason,
    daysRemaining: daysUntil(periodEnd),
    lockedMessage,
    allowedRoutePrefixes: isExpired
      ? ["/portal/subscription", "/pricing"]
      : isPending
        ? ["/portal/subscription", "/pricing"]
        : [],
  };
}

export async function getSubscriptionAccessForMess(messId: string, userId: string) {
  const res = await apiGet(`/billing/subscription?messId=${messId}`);
  if (!res.success || !res.data) {
    return resolveSubscriptionAccess({ userActive: true, subscription: null });
  }
  return resolveSubscriptionAccess({
    userActive: true,
    subscription: res.data,
  });
}

export async function assertMessWriteAccess(messId: string, userId?: string) {
  const uid =
    userId ??
    (await import("@/lib/mess-access").then((m) => m.requireAuth())).id;
  const access = await getSubscriptionAccessForMess(messId, uid);
  if (!access.canWrite) {
    throw new Error(access.reason ?? "Subscription does not allow this action");
  }
  return access;
}

export function canUsePlanFeature(
  access: SubscriptionAccessState,
  feature: string,
  opts?: { allowDuringExpired?: boolean }
) {
  if (!access.plan) return true;
  if (!opts?.allowDuringExpired && (!access.canWrite || access.isSuspended)) return false;
  return planHasFeature(access.plan, feature);
}

export function getFeatureAvailability(access: SubscriptionAccessState) {
  return {
    mealManagement: canUsePlanFeature(access, PLAN_FEATURES.MEAL_MANAGEMENT),
    depositManagement: canUsePlanFeature(access, PLAN_FEATURES.DEPOSIT_MANAGEMENT),
    expenseManagement: canUsePlanFeature(access, PLAN_FEATURES.EXPENSE_MANAGEMENT),
    bazaarManagement: canUsePlanFeature(access, PLAN_FEATURES.BAZAAR_MANAGEMENT),
    utilityBills: canUsePlanFeature(access, PLAN_FEATURES.UTILITY_BILLS),
    pdfReports: canUsePlanFeature(access, PLAN_FEATURES.PDF_REPORTS),
    excelReports: canUsePlanFeature(access, PLAN_FEATURES.EXCEL_REPORTS),
    csvExport: canUsePlanFeature(access, PLAN_FEATURES.CSV_EXPORT),
    analytics: canUsePlanFeature(access, PLAN_FEATURES.ANALYTICS),
    aiAnalytics: canUsePlanFeature(access, PLAN_FEATURES.AI_ANALYTICS),
    roomManagement: canUsePlanFeature(access, PLAN_FEATURES.ROOM_MANAGEMENT),
    bedManagement: canUsePlanFeature(access, PLAN_FEATURES.BED_MANAGEMENT),
    visitorManagement: canUsePlanFeature(access, PLAN_FEATURES.VISITOR_MANAGEMENT),
    taskManagement: canUsePlanFeature(access, PLAN_FEATURES.TASK_MANAGEMENT),
    noticeBoard: canUsePlanFeature(access, PLAN_FEATURES.NOTICE_BOARD),
    inventory: canUsePlanFeature(access, PLAN_FEATURES.INVENTORY),
    apiAccess: canUsePlanFeature(access, PLAN_FEATURES.API_ACCESS),
    whiteLabel: canUsePlanFeature(access, PLAN_FEATURES.WHITE_LABEL),
    customBranding: canUsePlanFeature(access, PLAN_FEATURES.CUSTOM_BRANDING),
  };
}

export async function getUserSubscriptionAccess(userId: string) {
  const res = await apiGet("/billing/subscription");
  return resolveSubscriptionAccess({
    userActive: true,
    subscription: res?.data || null,
  });
}

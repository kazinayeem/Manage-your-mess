import type { Member, Mess, UserRole } from "@prisma/client";
import { prisma } from "../config/database";
import { AuthError, ForbiddenError } from "../utils/errors";
import { hasPermission, isAdminRole, PERMISSIONS, type Permission } from "../constants/permissions";
import type { MessAccess, SessionUser } from "../types/auth";
import { planHasFeature, toParsedPlan, type ParsedPlan } from "../utils/plan-utils";

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

/**
 * Effective mess-scoped role resolution (mirrors lib/mess-role.ts):
 * - mess.managerId → MESS_MANAGER (full management)
 * - mess.ownerId (not manager) → MEMBER (view-only legal owner)
 * - stale elevated member roles → MEMBER
 */
export function resolveMessMemberRole(
  member: { userId: string; role: UserRole },
  mess: { ownerId: string; managerId: string | null }
): UserRole {
  if (mess.managerId && member.userId === mess.managerId) return "MESS_MANAGER";
  if (member.userId === mess.ownerId) return "MEMBER";
  if (member.role === "MESS_MANAGER" || member.role === "ASSISTANT_MANAGER" || member.role === "MESS_OWNER") {
    return "MEMBER";
  }
  return member.role;
}

export async function loadActiveUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new AuthError("Account not found");
  if (!user.isActive) throw new AuthError("Account suspended");
  if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError("Account temporarily locked");
  }
  return user;
}

export function requireAuthUser(user: SessionUser | undefined): SessionUser {
  if (!user?.id) throw new AuthError();
  return user;
}

export async function requireMessAccess(
  user: SessionUser,
  messId: string,
  permission?: keyof typeof PERMISSIONS,
  opts?: { allowPlatformAdmin?: boolean }
): Promise<MessAccess> {
  const allowPlatformAdmin = opts?.allowPlatformAdmin ?? false;

  const mess = await prisma.mess.findFirst({
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

  const member = await prisma.member.findFirst({
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

export function assertMemberScope(access: MessAccess, targetMemberId: string) {
  const canManageOthers = hasPermission(access.role, PERMISSIONS.MEMBER_UPDATE);
  if (!canManageOthers && access.member?.id !== targetMemberId) {
    throw new ForbiddenError("You can only modify your own records");
  }
}

export async function requireMessManager(user: SessionUser, messId: string): Promise<MessAccess> {
  const access = await requireMessAccess(user, messId);
  if (!access.mess.managerId || access.mess.managerId !== access.user.id) {
    throw new ForbiddenError("Only the manager can perform this action");
  }
  return access;
}

export function requireSuperAdmin(user: SessionUser | undefined): SessionUser {
  const session = requireAuthUser(user);
  if (!isAdminRole(session.role)) {
    throw new ForbiddenError("Permission denied");
  }
  return session;
}

export function requireAdmin(user: SessionUser | undefined): SessionUser {
  const session = requireAuthUser(user);
  if (!isAdminRole(session.role)) {
    throw new ForbiddenError("Permission denied");
  }
  return session;
}

// ─── Subscription access (mirrors lib/billing/subscription-access.ts) ───────

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
  const now = new Date();
  await prisma.subscription.updateMany({
    where: {
      ...(subscriptionId ? { id: subscriptionId } : {}),
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
      currentPeriodEnd: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
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
  const pastEnd = subscription.currentPeriodEnd <= now;
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
    reason = subscription.suspendReason ?? "This account has been suspended by the platform administrator.";
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
          ? `Your trial expires in ${daysUntil(subscription.trialEndsAt ?? subscription.currentPeriodEnd)} days`
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
    daysRemaining: daysUntil(subscription.currentPeriodEnd),
    lockedMessage,
    allowedRoutePrefixes: isExpired || isPending ? ["/portal/subscription", "/pricing"] : [],
  };
}

export async function getSubscriptionAccessForMess(messId: string, userId: string) {
  const [mess, user] = await Promise.all([
    prisma.mess.findFirst({
      where: { id: messId, deletedAt: null },
      include: {
        subscription: {
          select: {
            id: true,
            userId: true,
            planId: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            suspendedAt: true,
            suspendReason: true,
            stripeCustomerId: true,
            stripeSubId: true,
            createdAt: true,
            updatedAt: true,
            plan: { select: LEGACY_PLAN_SELECT },
          },
        },
        owner: { select: { id: true, isActive: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } }),
  ]);

  if (!mess || !user) {
    return resolveSubscriptionAccess({ userActive: false, subscription: null });
  }

  let subscription = mess.subscription as unknown as LegacySubscriptionWithPlan | null;
  if (!subscription) {
    const fallback = await prisma.subscription.findFirst({
      where: { userId: mess.ownerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        planId: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        suspendedAt: true,
        suspendReason: true,
        stripeCustomerId: true,
        stripeSubId: true,
        createdAt: true,
        updatedAt: true,
        plan: { select: LEGACY_PLAN_SELECT },
      },
    });
    subscription = fallback as unknown as LegacySubscriptionWithPlan | null;
  }

  if (subscription) {
    await syncExpiredSubscriptions(subscription.id);
    const fresh = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      select: {
        id: true,
        userId: true,
        planId: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        suspendedAt: true,
        suspendReason: true,
        stripeCustomerId: true,
        stripeSubId: true,
        createdAt: true,
        updatedAt: true,
        plan: { select: LEGACY_PLAN_SELECT },
      },
    });
    if (fresh) subscription = fresh as unknown as LegacySubscriptionWithPlan;
  }

  return resolveSubscriptionAccess({
    userActive: user.isActive && mess.owner.isActive,
    subscription,
  });
}

export async function assertMessWriteAccess(messId: string, userId: string) {
  const access = await getSubscriptionAccessForMess(messId, userId);
  if (!access.canWrite) {
    throw new ForbiddenError(access.reason ?? "Subscription does not allow this action");
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
    mealManagement: canUsePlanFeature(access, "meal_management"),
    depositManagement: canUsePlanFeature(access, "deposit_management"),
    expenseManagement: canUsePlanFeature(access, "expense_management"),
    bazaarManagement: canUsePlanFeature(access, "bazaar_management"),
    utilityBills: canUsePlanFeature(access, "utility_bills"),
    pdfReports: canUsePlanFeature(access, "pdf_reports"),
    excelReports: canUsePlanFeature(access, "excel_reports"),
    csvExport: canUsePlanFeature(access, "csv_export"),
    analytics: canUsePlanFeature(access, "analytics"),
    aiAnalytics: canUsePlanFeature(access, "ai_analytics"),
    roomManagement: canUsePlanFeature(access, "room_management"),
    bedManagement: canUsePlanFeature(access, "bed_management"),
    visitorManagement: canUsePlanFeature(access, "visitor_management"),
    taskManagement: canUsePlanFeature(access, "task_management"),
    noticeBoard: canUsePlanFeature(access, "notice_board"),
    inventory: canUsePlanFeature(access, "inventory"),
    apiAccess: canUsePlanFeature(access, "api_access"),
    whiteLabel: canUsePlanFeature(access, "white_label"),
    customBranding: canUsePlanFeature(access, "custom_branding"),
  };
}

export async function getUserSubscriptionAccess(userId: string) {
  await syncExpiredSubscriptions();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      planId: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      suspendedAt: true,
      suspendReason: true,
      stripeCustomerId: true,
      stripeSubId: true,
      createdAt: true,
      updatedAt: true,
      plan: { select: LEGACY_PLAN_SELECT },
    },
  });
  return resolveSubscriptionAccess({
    userActive: user?.isActive ?? false,
    subscription: subscription as unknown as LegacySubscriptionWithPlan | null,
  });
}

export type { Mess, Member };
export { LEGACY_PLAN_SELECT };
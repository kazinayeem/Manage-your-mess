import { db } from "@/lib/db";
import { toParsedPlan, type ParsedPlan } from "@/lib/billing/plan-utils";
import type { Subscription, Plan } from "@prisma/client";

export type SubscriptionAccessState = {
  canView: boolean;
  canWrite: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isUserSuspended: boolean;
  status: string;
  plan: ParsedPlan | null;
  reason: string | null;
  daysRemaining: number;
};

function daysUntil(end: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Mark subscriptions past end date as EXPIRED. */
export async function syncExpiredSubscriptions(subscriptionId?: string) {
  const now = new Date();
  await db.subscription.updateMany({
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
  subscription: (Subscription & { plan?: Plan | null }) | null;
}): SubscriptionAccessState {
  const { userActive, subscription } = opts;

  if (!userActive) {
    return {
      canView: true,
      canWrite: false,
      isExpired: false,
      isSuspended: true,
      isUserSuspended: true,
      status: "SUSPENDED",
      plan: subscription?.plan ? toParsedPlan(subscription.plan) : null,
      reason: "Your account has been suspended by the platform administrator.",
      daysRemaining: 0,
    };
  }

  if (!subscription) {
    return {
      canView: true,
      canWrite: true,
      isExpired: false,
      isSuspended: false,
      isUserSuspended: false,
      status: "ACTIVE",
      plan: null,
      reason: null,
      daysRemaining: 0,
    };
  }

  const plan = subscription.plan ? toParsedPlan(subscription.plan) : null;
  const now = new Date();
  const pastEnd = subscription.currentPeriodEnd <= now;
  let status = subscription.status;

  if (pastEnd && (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE")) {
    status = "EXPIRED";
  }

  const isSuspended = status === "SUSPENDED" || status === "CANCELLED";
  const isExpired = status === "EXPIRED" || pastEnd;
  const isPending = status === "PENDING";

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

  return {
    canView: true,
    canWrite,
    isExpired,
    isSuspended,
    isUserSuspended: false,
    status,
    plan,
    reason,
    daysRemaining: daysUntil(subscription.currentPeriodEnd),
  };
}

export async function getSubscriptionAccessForMess(messId: string, userId: string) {
  const [mess, user] = await Promise.all([
    db.mess.findFirst({
      where: { id: messId, deletedAt: null },
      include: {
        subscription: { include: { plan: true } },
        owner: { select: { id: true, isActive: true } },
      },
    }),
    db.user.findUnique({ where: { id: userId }, select: { isActive: true } }),
  ]);

  if (!mess || !user) {
    return resolveSubscriptionAccess({ userActive: false, subscription: null });
  }

  let subscription = mess.subscription;
  if (!subscription) {
    subscription = await db.subscription.findFirst({
      where: { userId: mess.ownerId },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });
  }

  if (subscription) {
    await syncExpiredSubscriptions(subscription.id);
    subscription =
      (await db.subscription.findUnique({
        where: { id: subscription.id },
        include: { plan: true },
      })) ?? subscription;
  }

  return resolveSubscriptionAccess({
    userActive: user.isActive && mess.owner.isActive,
    subscription,
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

export async function getUserSubscriptionAccess(userId: string) {
  await syncExpiredSubscriptions();
  const user = await db.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  const subscription = await db.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
  return resolveSubscriptionAccess({
    userActive: user?.isActive ?? false,
    subscription,
  });
}

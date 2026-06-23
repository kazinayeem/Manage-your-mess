import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getActiveMessIdFromCookie } from "@/lib/active-mess";
import { getMessCapabilities, type MessCapabilities } from "@/lib/mess-permissions";
import { resolveMessMemberRole, isDesignatedManager } from "@/lib/mess-role";
import {
  getSubscriptionAccessForMess,
  type SubscriptionAccessState,
} from "@/lib/billing/subscription-access";
import type { PlanTier } from "@/lib/plans";
import type { UserRole } from "@prisma/client";

function applySubscriptionToCapabilities(
  capabilities: MessCapabilities,
  subscriptionAccess: SubscriptionAccessState
): MessCapabilities {
  if (subscriptionAccess.canWrite) return capabilities;
  return {
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
    canGenerateReports: capabilities.canGenerateReports,
    canViewMembers: capabilities.canViewMembers,
    canManageBazaar: false,
    canViewMyBazaar: capabilities.canViewMyBazaar,
  };
}

export async function getUserMemberships(userId: string) {
  return db.member.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { in: ["ACTIVE", "PENDING"] },
    },
    include: {
      mess: {
        include: {
          currentMonth: true,
          subscription: { include: { plan: true } },
          owner: { select: { id: true, name: true, email: true } },
          manager: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type MessContext = NonNullable<Awaited<ReturnType<typeof getMessContextById>>>;

function buildMessContext(
  userId: string,
  platformRole: UserRole,
  membership: Awaited<ReturnType<typeof getUserMemberships>>[number],
  allMesses: Awaited<ReturnType<typeof getUserMemberships>>,
  subscriptionAccess: SubscriptionAccessState
) {
  const planTier = (membership.mess.subscription?.plan.tier ?? "FREE") as PlanTier;
  const isOwner = membership.mess.ownerId === userId;
  const effectiveRole = resolveMessMemberRole(
    { userId: membership.userId, role: membership.role },
    { ownerId: membership.mess.ownerId, managerId: membership.mess.managerId }
  );
  const isManager = isDesignatedManager(
    { userId: membership.userId, role: membership.role },
    { ownerId: membership.mess.ownerId, managerId: membership.mess.managerId }
  );
  const roleCapabilities = getMessCapabilities(effectiveRole);
  const capabilities = applySubscriptionToCapabilities(roleCapabilities, subscriptionAccess);

  return {
    userId,
    userRole: platformRole,
    member: membership,
    mess: membership.mess,
    messId: membership.messId,
    planTier,
    currentMonth: membership.mess.currentMonth,
    isOwner,
    isManager,
    effectiveRole,
    capabilities,
    subscriptionAccess,
    canManageInvite: isManager && subscriptionAccess.canWrite,
    allMesses: allMesses.map((m) => ({
      messId: m.messId,
      name: m.mess.name,
      role: resolveMessMemberRole(
        { userId: m.userId, role: m.role },
        { ownerId: m.mess.ownerId, managerId: m.mess.managerId }
      ),
      status: m.status,
      inviteCode: m.mess.inviteCode,
      isOwner: m.mess.ownerId === userId,
      isManager: m.mess.managerId === userId,
    })),
  };
}

export async function getMessContextById(messId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await getUserMemberships(session.user.id);
  const membership = memberships.find((m) => m.messId === messId);
  if (!membership) return null;

  const subscriptionAccess = await getSubscriptionAccessForMess(messId, session.user.id);
  return buildMessContext(
    session.user.id,
    session.user.role,
    membership,
    memberships,
    subscriptionAccess
  );
}

export async function getActiveMessContext() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await getUserMemberships(session.user.id);
  if (!memberships.length) return null;

  const preferredId = await getActiveMessIdFromCookie();
  const membership =
    memberships.find((m) => m.messId === preferredId) ?? memberships[0];

  const subscriptionAccess = await getSubscriptionAccessForMess(
    membership.messId,
    session.user.id
  );
  return buildMessContext(
    session.user.id,
    session.user.role,
    membership,
    memberships,
    subscriptionAccess
  );
}

export async function ensureCurrentMonth(messId: string) {
  const mess = await db.mess.findUnique({
    where: { id: messId },
    include: { currentMonth: true },
  });
  if (!mess) throw new Error("Mess not found");
  if (mess.currentMonth) return mess.currentMonth;

  const { formatMonthLabel, getCurrentYearMonth } = await import("@/lib/calculations");
  const { year, month } = getCurrentYearMonth();
  const monthRecord = await db.messMonth.create({
    data: {
      messId,
      year,
      month,
      label: formatMonthLabel(year, month),
      status: "ACTIVE",
    },
  });

  await db.mess.update({
    where: { id: messId },
    data: { currentMonthId: monthRecord.id },
  });

  return monthRecord;
}

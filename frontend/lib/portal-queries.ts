import { db } from "@/lib/db";
import { resolveMessMemberRole } from "@/lib/mess-role";
import type { PlanTier } from "@/lib/plans";

export type PortalMessCard = {
  messId: string;
  name: string;
  logo: string | null;
  roleRaw: import("@prisma/client").UserRole;
  isManager: boolean;
  isLegalOwner: boolean;
  memberCount: number;
  currentMonth: string | null;
  plan: PlanTier;
  status: "ACTIVE" | "PENDING";
  lastActivity: Date;
};

export async function getPortalMesses(userId: string): Promise<PortalMessCard[]> {
  const memberships = await db.member.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { in: ["ACTIVE", "PENDING"] },
    },
    include: {
      mess: {
        include: {
          currentMonth: true,
          subscription: {
            select: {
              id: true,
              status: true,
              currentPeriodEnd: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                },
              },
            },
          },
          _count: { select: { members: { where: { deletedAt: null, status: "ACTIVE" } } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return memberships.map((m) => {
    const effectiveRole = resolveMessMemberRole(
      { userId: m.userId, role: m.role },
      { ownerId: m.mess.ownerId, managerId: m.mess.managerId }
    );
    const isManager = Boolean(m.mess.managerId && m.userId === m.mess.managerId);
    const isLegalOwner = m.mess.ownerId === m.userId;

    return {
      messId: m.messId,
      name: m.mess.name,
      logo: m.mess.logo,
      roleRaw: effectiveRole,
      isManager,
      isLegalOwner: isLegalOwner && !isManager,
      memberCount: m.mess._count.members,
      currentMonth: m.mess.currentMonth?.label ?? null,
      plan: (m.mess.subscription?.plan.tier ?? "FREE") as PlanTier,
      status: m.status === "ACTIVE" ? "ACTIVE" : "PENDING",
      lastActivity: m.mess.updatedAt,
    };
  });
}

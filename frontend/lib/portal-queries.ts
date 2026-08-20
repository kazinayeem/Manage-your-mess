import { apiGet } from "@/lib/api-client";
import { resolveMessMemberRole } from "@/lib/mess-role";
import type { PlanTier } from "@/lib/plans";

export type PortalMessCard = {
  messId: string;
  name: string;
  logo: string | null;
  roleRaw: import("@/types/domain").UserRole;
  isManager: boolean;
  isLegalOwner: boolean;
  memberCount: number;
  currentMonth: string | null;
  plan: PlanTier;
  status: "ACTIVE" | "PENDING";
  lastActivity: Date;
};

export async function getPortalMesses(userId: string): Promise<PortalMessCard[]> {
  const res = await apiGet("/messes");
  if (!res.success || !res.data) return [];

  const messes = res.data;
  return messes.map((m: any) => {
    const effectiveRole = resolveMessMemberRole(
      { userId, role: m.role || "MEMBER" },
      { ownerId: m.ownerId, managerId: m.managerId }
    );
    const isManager = Boolean(m.managerId && userId === m.managerId);
    const isLegalOwner = m.ownerId === userId;

    return {
      messId: m.id || m.messId,
      name: m.name,
      logo: m.logo || null,
      roleRaw: effectiveRole,
      isManager,
      isLegalOwner: isLegalOwner && !isManager,
      memberCount: m.memberCount || 0,
      currentMonth: m.currentMonth?.label ?? null,
      plan: (m.subscription?.plan?.tier ?? "FREE") as PlanTier,
      status: m.status === "ACTIVE" ? "ACTIVE" : "PENDING",
      lastActivity: new Date(m.updatedAt || Date.now()),
    };
  });
}

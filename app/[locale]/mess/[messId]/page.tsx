import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMessContextById, ensureCurrentMonth } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { QuickActions } from "@/components/mess/quick-actions";
import { InviteCard } from "@/components/mess/invite-card";
import { MessDashboardView } from "@/components/mess/mess-dashboard-view";
import { PendingMembersPanel } from "@/components/mess/pending-members-panel";
import { Badge } from "@/components/ui/badge";
import { getMessDisplayRoleLabel } from "@/lib/mess-role-label";
import { db } from "@/lib/db";
import { BillKpiCards } from "@/components/mess/bill-kpi-cards";
import type { MemberCardData } from "@/components/mess/member-card";

export default async function MessDashboardPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await getMessContextById(messId);
  if (!ctx) notFound();

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const summary = await getMonthSummary(ctx.messId, month.id);
  if (!summary) notFound();

  const allJoined = await db.member.findMany({
    where: {
      messId: ctx.messId,
      deletedAt: null,
      status: { in: ["ACTIVE", "PENDING"] },
    },
    include: { user: { select: { email: true } } },
    orderBy: { fullName: "asc" },
  });

  const pendingMembers = allJoined
    .filter((m) => m.status === "PENDING")
    .map((m) => ({
      id: m.id,
      fullName: m.fullName,
      email: m.user.email,
    }));

  const myStats = summary.members.find((m) => m.id === ctx.member.id);
  const totalMealCost = summary.totalMeals * summary.mealRate;
  const messBalance = summary.billKpis.messBalance;

  const memberCards: MemberCardData[] = allJoined.map((m) => {
    const stats = summary.members.find((s) => s.id === m.id);
    if (stats) {
      return {
        id: stats.id,
        fullName: stats.fullName,
        phone: stats.phone,
        mealCount: stats.mealCount,
        mealCost: stats.mealCost,
        totalDeposit: stats.totalDeposit,
        due: stats.due,
        advance: stats.advance,
        balance: stats.balance,
        sharedCostShare: stats.sharedCostShare,
        billShares: stats.billShares,
        totalCost: stats.totalCost,
        status: stats.status,
      };
    }
    return {
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      mealCount: 0,
      mealCost: 0,
      totalDeposit: 0,
      due: 0,
      advance: 0,
      balance: 0,
      sharedCostShare: 0,
      status: m.status,
    };
  });

  const myMealCount = myStats?.mealCount ?? 0;
  const myDeposit = myStats?.totalDeposit ?? 0;
  const myMealCost = myStats?.mealCost ?? 0;
  const myBillShare = myStats?.totalBillShare ?? 0;
  const myCost = myStats?.totalCost ?? myMealCost + myBillShare;
  const myBalance = myStats ? (myStats.advance > 0 ? myStats.advance : -myStats.due) : myDeposit - myCost;

  const tRoles = await getTranslations("roles");
  const tWorkspace = await getTranslations("workspace");
  const roleLabel = getMessDisplayRoleLabel(ctx.effectiveRole, tRoles, {
    isLegalOwner: ctx.isOwner && !ctx.isManager,
    isActiveManager: ctx.isManager,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{roleLabel}</Badge>
          {ctx.capabilities.readOnly && (
            <Badge variant="secondary">{tWorkspace("readOnly")}</Badge>
          )}
        </div>
        <QuickActions messId={messId} capabilities={ctx.capabilities} isManager={ctx.isManager} />
      </div>

      {ctx.canManageInvite && !ctx.capabilities.readOnly && (
        <InviteCard
          messId={ctx.messId}
          messName={ctx.mess.name}
          inviteCode={ctx.mess.inviteCode}
        />
      )}

      {ctx.isManager && pendingMembers.length > 0 && (
        <PendingMembersPanel messId={messId} members={pendingMembers} />
      )}

      <BillKpiCards kpis={summary.billKpis} />

      <MessDashboardView
        messId={messId}
        overview={{
          messName: ctx.mess.name,
          monthLabel: summary.month.label,
          monthStatus: summary.month.status,
          messBalance,
          totalDeposit: summary.totalDeposits,
          totalMeals: summary.totalMeals,
          totalMealCost,
          mealRate: summary.mealRate,
          totalRent: summary.billKpis.totalRent,
          totalUtilities: summary.billKpis.totalUtilities,
          sharedOtherCost: summary.billKpis.totalSharedBills,
        }}
        mySummary={{
          mealCount: myMealCount,
          totalDeposit: myDeposit,
          myCost,
          myMealCost,
          myBillShare,
          balance: myBalance,
        }}
        members={memberCards}
        capabilities={ctx.capabilities}
      />
    </div>
  );
}

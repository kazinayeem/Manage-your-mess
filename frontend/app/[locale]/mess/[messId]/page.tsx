import { notFound } from "next/navigation";
import { getMessContextById, ensureCurrentMonth } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { MessDashboardView } from "@/components/mess/mess-dashboard-view";
import { getTranslations } from "next-intl/server";
import { getMessDisplayRoleLabel } from "@/lib/mess-role-label";

export default async function MessDashboardPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await getMessContextById(messId);
  if (!ctx) notFound();

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const res = await apiGet(`/reports/data?messId=${ctx.messId}&monthId=${month.id}`);
  const reportData = res?.data;
  if (!reportData) notFound();

  const rows = reportData?.rows || [];
  const summaryList = reportData?.summary || [];

  const getSummaryVal = (label: string) => {
    const item = summaryList.find((s: any) => s.label === label);
    return item?.value ?? "0";
  };

  const memberRows = rows.map((m: any, idx: number) => ({
    id: m.id || String(idx),
    fullName: m.name,
    phone: m.phone || "",
    mealCount: m.mealCount || 0,
    totalDeposit: m.deposit || 0,
    totalCost: m.totalCost || 0,
    balance: m.balance || 0,
    status: m.status || "ACTIVE",
  }));

  const [tRoles, tDash] = await Promise.all([
    getTranslations("roles"),
    getTranslations("messDashboard"),
  ]);
  const roleLabel = getMessDisplayRoleLabel(ctx.effectiveRole, tRoles, {
    isLegalOwner: ctx.isOwner && !ctx.isManager,
    isActiveManager: ctx.isManager,
  });

  return (
    <div className="space-y-6">
      <MessDashboardView
        messId={messId}
        userName={ctx.member.fullName ?? tDash("fallbackManager")}
        roleLabel={roleLabel}
        overview={{
          messName: ctx.mess.name,
          monthLabel: month.label,
          currentBalance: Number(getSummaryVal("Closing Balance")?.replace(/[^0-9.-]+/g, "")) || 0,
          mealRate: Number(getSummaryVal("Meal Rate")?.replace(/[^0-9.-]+/g, "")) || 0,
          totalDeposit: Number(getSummaryVal("Total Deposits")?.replace(/[^0-9.-]+/g, "")) || 0,
          totalExpense: Number(getSummaryVal("Total Expenses")?.replace(/[^0-9.-]+/g, "")) || 0,
          totalMembers: memberRows.length,
          totalDue: Number(getSummaryVal("Total Due")?.replace(/[^0-9.-]+/g, "")) || 0,
          planName: ctx.subscriptionAccess.plan?.name ?? ctx.mess.subscription?.plan?.name ?? ctx.planTier,
          daysRemaining: ctx.subscriptionAccess.daysRemaining,
        }}
        capabilities={ctx.capabilities}
        members={memberRows}
        notifications={[]}
        todaySummary={{
          meals: 0,
          expenses: 0,
          deposits: 0,
          pendingBazaar: 0,
          pendingMembers: 0,
        }}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { getMessBills } from "@/actions/bills";
import { MonthStats } from "@/components/mess/month-stats";
import { BillKpiCards } from "@/components/mess/bill-kpi-cards";
import { MonthDetailsTabs } from "@/components/mess/month-details-tabs";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

export default async function MessCurrentMonthPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  const t = await getTranslations("messCurrentMonth");

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const summary = await getMonthSummary(ctx.messId, month.id);
  if (!summary) notFound();

  const bills = await getMessBills(messId, { monthId: month.id });
  const totalMealCost = summary.totalMeals * summary.mealRate;

  const tableMembers = summary.members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    phone: m.phone,
    mealCount: m.mealCount,
    mealCost: m.mealCost,
    totalDeposit: m.totalDeposit,
    sharedCostShare: m.sharedCostShare,
    billShares: m.billShares,
    due: m.due,
    advance: m.advance,
    balance: m.balance,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Badge variant={summary.month.status === "ACTIVE" ? "default" : "secondary"}>
          {summary.month.status === "ACTIVE" ? t("running") : summary.month.status}
        </Badge>
      </div>

      <MonthStats
        stats={{
          monthLabel: summary.month.label,
          totalMembers: summary.memberCount,
          totalMeals: summary.totalMeals,
          totalExpenses: summary.totalExpenses,
          totalDeposits: summary.totalDeposits,
          mealRate: summary.mealRate,
          totalDue: summary.totalDue,
        }}
      />

      <BillKpiCards kpis={summary.billKpis} />

      <MonthDetailsTabs
        messId={messId}
        members={tableMembers}
        bills={bills}
        billsByCategory={summary.billsByCategory}
        mealRate={summary.mealRate}
        totalMeals={summary.totalMeals}
        totalMealCost={totalMealCost}
        readOnly={ctx.capabilities.readOnly || !ctx.capabilities.canManageBills}
        labels={{
          memberReport: t("memberReport"),
          member: t("member"),
          unnamed: t("unnamed"),
          meals: t("meals"),
          mealCost: t("mealCost"),
          deposit: t("deposit"),
          sharedCost: t("sharedCost"),
          rent: t("rent"),
          electricity: t("electricity"),
          water: t("water"),
          internet: t("internet"),
          otherShare: t("otherShare"),
          totalCost: t("totalCost"),
          due: t("due"),
          advance: t("advance"),
          balance: t("balance"),
          total: t("total"),
          noMembers: t("noMembers"),
          scrollHint: t("scrollHint"),
        }}
      />
    </div>
  );
}

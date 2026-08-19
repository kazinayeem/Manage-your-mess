import { redirect } from "next/navigation";
import { getActiveMessContext, ensureCurrentMonth } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { MonthStats } from "@/components/mess/month-stats";
import { CurrentMonthReportTable } from "@/components/mess/current-month-report-table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export default async function CurrentMonthPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const summary = await getMonthSummary(ctx.messId, month.id);
  if (!summary) redirect("/portal");

  const t = await getTranslations("messCurrentMonth");
  const messBalance = summary.totalDeposits - summary.totalExpenses;
  const totalMealCost = summary.totalMeals * summary.mealRate;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("messBalance")}</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(messBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("totalMealCost")}</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(totalMealCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("sharedCost")}</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(summary.month.sharedCost)}</p>
          </CardContent>
        </Card>
      </div>
      <CurrentMonthReportTable
        members={summary.members.map((m) => ({
          id: m.id,
          fullName: m.fullName,
          phone: m.phone,
          mealCount: m.mealCount,
          mealCost: m.mealCost,
          totalDeposit: m.totalDeposit,
          sharedCostShare: m.sharedCostShare,
          due: m.due,
          advance: m.advance,
          balance: m.balance,
        }))}
        labels={{
          memberReport: t("memberReport"),
          member: t("member"),
          unnamed: t("unnamed"),
          meals: t("meals"),
          mealCost: t("mealCost"),
          deposit: t("deposit"),
          sharedCost: t("sharedCost"),
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

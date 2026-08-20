import { redirect } from "next/navigation";
import { getActiveMessContext, ensureCurrentMonth } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { MonthStats } from "@/components/mess/month-stats";
import { CurrentMonthReportTable } from "@/components/mess/current-month-report-table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export default async function CurrentMonthPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const res = await apiGet(`/reports/data?messId=${ctx.messId}&monthId=${month.id}`);
  const reportData = res?.data;
  if (!reportData) redirect("/portal");

  const t = await getTranslations("messCurrentMonth");

  const summaryList = reportData?.summary || [];
  const getSummaryVal = (label: string) => {
    const item = summaryList.find((s: any) => s.label === label);
    return item?.value ?? "0";
  };

  const rows = reportData?.rows || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <MonthStats
        stats={{
          monthLabel: month.label,
          totalMembers: Number(getSummaryVal("Total Members")),
          totalMeals: Number(getSummaryVal("Total Meals")),
          totalExpenses: getSummaryVal("Total Expenses"),
          totalDeposits: getSummaryVal("Total Deposits"),
          mealRate: getSummaryVal("Meal Rate"),
          totalDue: getSummaryVal("Total Due"),
        }}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("messBalance")}</p>
            <p className="mt-1 text-xl font-bold">{getSummaryVal("Closing Balance")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("totalMealCost")}</p>
            <p className="mt-1 text-xl font-bold">{getSummaryVal("Meal Cost") || formatCurrency(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("sharedCost")}</p>
            <p className="mt-1 text-xl font-bold">{getSummaryVal("Total Shared Cost")}</p>
          </CardContent>
        </Card>
      </div>
      <CurrentMonthReportTable
        members={rows.map((m: any, idx: number) => ({
          id: m.id || String(idx),
          fullName: m.name,
          phone: m.phone || "",
          mealCount: m.mealCount || 0,
          mealCost: m.mealCost || 0,
          totalDeposit: m.deposit || 0,
          sharedCostShare: m.billShare || 0,
          due: m.status === "Due" ? Math.abs(m.balance || 0) : 0,
          advance: m.status === "Advance" ? m.balance || 0 : 0,
          balance: m.balance || 0,
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

import { notFound } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
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
  const [reportRes, billsRes] = await Promise.all([
    apiGet(`/reports/data?messId=${messId}&monthId=${month.id}`),
    apiGet(`/bills?messId=${messId}&monthId=${month.id}`),
  ]);

  const reportData = reportRes?.data;
  if (!reportData) notFound();

  const bills = billsRes?.data || billsRes || [];
  const rows = reportData?.rows || [];
  const summaryList = reportData?.summary || [];

  const getSummaryVal = (label: string) => {
    const item = summaryList.find((s: any) => s.label === label);
    return item?.value ?? "0";
  };

  const tableMembers = rows.map((m: any, idx: number) => ({
    id: m.id || String(idx),
    fullName: m.name,
    phone: m.phone || "",
    mealCount: m.mealCount || 0,
    mealCost: m.mealCost || 0,
    totalDeposit: m.deposit || 0,
    sharedCostShare: m.billShare || 0,
    billShares: m.billShares || {},
    due: m.status === "Due" ? Math.abs(m.balance || 0) : 0,
    advance: m.status === "Advance" ? m.balance || 0 : 0,
    balance: m.balance || 0,
  }));

  const totalMeals = Number(getSummaryVal("Total Meals")) || 0;
  const mealRate = Number(getSummaryVal("Meal Rate")?.replace(/[^0-9.-]+/g, "")) || 0;
  const totalMealCost = totalMeals * mealRate;

  const billKpis = {
    totalRent: 0,
    totalUtilities: 0,
    totalSharedBills: 0,
    totalMealCost,
    totalDeposits: Number(getSummaryVal("Total Deposits")?.replace(/[^0-9.-]+/g, "")) || 0,
    totalDue: Number(getSummaryVal("Total Due")?.replace(/[^0-9.-]+/g, "")) || 0,
    messBalance: Number(getSummaryVal("Closing Balance")?.replace(/[^0-9.-]+/g, "")) || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Badge variant={month.status === "ACTIVE" ? "default" : "secondary"}>
          {month.status === "ACTIVE" ? t("running") : month.status}
        </Badge>
      </div>

      <MonthStats
        stats={{
          monthLabel: month.label,
          totalMembers: tableMembers.length,
          totalMeals,
          totalExpenses: getSummaryVal("Total Expenses"),
          totalDeposits: getSummaryVal("Total Deposits"),
          mealRate: getSummaryVal("Meal Rate"),
          totalDue: getSummaryVal("Total Due"),
        }}
      />

      <BillKpiCards kpis={billKpis} />

      <MonthDetailsTabs
        messId={messId}
        members={tableMembers}
        bills={Array.isArray(bills) ? bills : []}
        billsByCategory={{}}
        mealRate={mealRate}
        totalMeals={totalMeals}
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

"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useMessAnalyticsQuery } from "@/lib/store/api/analytics-api";
import { useFilterStore } from "@/stores";
import { AnalyticsFilters } from "./analytics-filters";
import { AiInsights } from "./ai-insights";
import { KpiSkeletonGrid } from "./chart-skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const LineChartBlock = dynamic(() => import("./charts/line-chart-block"), { ssr: false });
const PieChartBlock = dynamic(() => import("./charts/pie-chart-block"), { ssr: false });
const BarChartBlock = dynamic(() => import("./charts/bar-chart-block"), { ssr: false });

export function MessAnalyticsView({ messId, locale }: { messId: string; locale: string }) {
  const range = useFilterStore((s) => s.analyticsRange);
  const { data, isLoading, isFetching, refetch, error } = useMessAnalyticsQuery({
    messId,
    range,
  });

  if (error) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-red-600">Failed to load analytics.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !data) return <KpiSkeletonGrid count={8} />;

  const o = data.overview;
  const kpis = [
    { label: "Total Members", value: String(o.totalMembers) },
    { label: "Active Members", value: String(o.activeMembers) },
    { label: "Total Meals", value: String(o.totalMeals) },
    { label: "Total Deposits", value: formatCurrency(o.totalDeposits) },
    { label: "Total Expenses", value: formatCurrency(o.totalExpenses) },
    { label: "Meal Rate", value: formatCurrency(o.mealRate) },
    { label: "Total Due", value: formatCurrency(o.totalDue) },
    { label: "Balance", value: formatCurrency(o.currentBalance) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnalyticsFilters locale={locale} />
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-zinc-200">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">{k.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AiInsights insights={data.insights} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Expense Trend</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock data={data.expenseTrend} xKey="month" lines={[{ key: "amount", color: "#18181b", name: "Expenses" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Deposit Trend</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock data={data.depositTrend} xKey="month" lines={[{ key: "amount", color: "#52525b", name: "Deposits" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
          <CardContent><PieChartBlock data={data.expenseBreakdown} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Meal Consumption</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock
              data={data.mealByMonth}
              xKey="month"
              lines={[
                { key: "breakfast", color: "#18181b", name: "Breakfast" },
                { key: "lunch", color: "#52525b", name: "Lunch" },
                { key: "dinner", color: "#a1a1aa", name: "Dinner" },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Depositors</CardTitle></CardHeader>
          <CardContent>
            <BarChartBlock data={data.depositRanking} xKey="name" yKey="deposit" layout="vertical" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Highest Due</CardTitle></CardHeader>
          <CardContent>
            <BarChartBlock data={data.dueRanking} xKey="name" yKey="due" layout="vertical" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Budget vs Actual</CardTitle></CardHeader>
          <CardContent>
            <BarChartBlock data={data.budgetVsActual} xKey="month" yKey="actual" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Utility Cost Trend</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock
              data={data.utilityTrend}
              xKey="month"
              lines={[
                { key: "electricity", color: "#18181b", name: "Electricity" },
                { key: "water", color: "#52525b", name: "Water" },
                { key: "gas", color: "#71717a", name: "Gas" },
                { key: "internet", color: "#a1a1aa", name: "Internet" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

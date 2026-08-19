"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useMemberAnalyticsQuery } from "@/lib/store/api/analytics-api";
import { AiInsights } from "./ai-insights";
import { KpiSkeletonGrid } from "./chart-skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const LineChartBlock = dynamic(() => import("./charts/line-chart-block"), { ssr: false });

export function MemberAnalyticsView({ messId }: { messId: string }) {
  const { data, isLoading, isFetching, refetch, error } = useMemberAnalyticsQuery({ messId });

  if (error) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-red-600">Failed to load your analytics.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !data) return <KpiSkeletonGrid count={5} />;

  const o = data.overview;
  const kpis = [
    { label: "My Meals", value: String(o.myMeals) },
    { label: "My Deposits", value: formatCurrency(o.myDeposits) },
    { label: "My Expenses", value: formatCurrency(o.myExpenses) },
    { label: "My Due", value: formatCurrency(o.myDue) },
    { label: "My Balance", value: formatCurrency(o.myBalance) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
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
          <CardHeader><CardTitle className="text-base">Meal Trend</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock data={data.mealTrend} xKey="month" lines={[{ key: "meals", color: "#18181b", name: "Meals" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Deposit Trend</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock data={data.depositTrend} xKey="month" lines={[{ key: "amount", color: "#52525b", name: "Deposits" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Cost Trend</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock data={data.costTrend} xKey="month" lines={[{ key: "cost", color: "#71717a", name: "Cost" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Balance Trend</CardTitle></CardHeader>
          <CardContent>
            <LineChartBlock data={data.balanceTrend} xKey="month" lines={[{ key: "balance", color: "#18181b", name: "Balance" }]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

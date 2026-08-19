"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useSuperAdminAnalyticsQuery } from "@/lib/store/api/analytics-api";
import { useFilterStore } from "@/stores";
import { AnalyticsFilters } from "./analytics-filters";
import { AiInsights } from "./ai-insights";
import { ChartSkeleton, KpiSkeletonGrid } from "./chart-skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const LineChartBlock = dynamic(() => import("./charts/line-chart-block"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const PieChartBlock = dynamic(() => import("./charts/pie-chart-block"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const BarChartBlock = dynamic(() => import("./charts/bar-chart-block"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export function SuperAdminAnalyticsView({ locale }: { locale: string }) {
  const range = useFilterStore((s) => s.analyticsRange);
  const { data, isLoading, isFetching, refetch, error } = useSuperAdminAnalyticsQuery({
    range,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">Failed to load analytics.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !data) return <KpiSkeletonGrid count={8} />;

  const o = data.overview;
  const kpis = [
    { label: "Total Users", value: String(o.totalUsers) },
    { label: "Active Users", value: String(o.activeUsers) },
    { label: "Total Messes", value: String(o.totalMesses) },
    { label: "Total Members", value: String(o.totalMembers) },
    { label: "Total Revenue", value: formatCurrency(o.totalRevenue) },
    { label: "Monthly Revenue", value: formatCurrency(o.monthlyRevenue) },
    { label: "Yearly Revenue", value: formatCurrency(o.annualRevenue) },
    { label: "Active Subscriptions", value: String(o.activeSubscriptions) },
    { label: "Expired Subscriptions", value: String(o.expiredSubscriptions) },
    { label: "Pending Payments", value: String(o.pendingPayments) },
    { label: "Approved Payments", value: String(o.approvedPayments) },
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-zinc-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">{k.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AiInsights insights={data.insights} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartBlock
              data={data.revenueTrend}
              xKey="month"
              lines={[{ key: "revenue", color: "#18181b", name: "Revenue" }]}
            />
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-base">Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartBlock data={data.subscriptionDist} />
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-base">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartBlock
              data={data.userGrowth}
              xKey="month"
              lines={[{ key: "users", color: "#52525b", name: "New Users" }]}
            />
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-base">Top Messes by Members</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartBlock data={data.topMesses} xKey="name" yKey="members" layout="vertical" />
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartBlock data={data.paymentUsage} />
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-base">Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartBlock
              data={data.tickets.map((t) => ({ name: t.status, value: t.count }))}
              xKey="name"
              yKey="value"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

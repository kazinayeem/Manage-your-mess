"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MiniExpenseChart = dynamic(
  () => import("@/components/landing/mini-charts").then((m) => m.MiniExpenseChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const MiniDepositChart = dynamic(
  () => import("@/components/landing/mini-charts").then((m) => m.MiniDepositChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const MiniMealChart = dynamic(
  () => import("@/components/landing/mini-charts").then((m) => m.MiniMealChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const MiniDueChart = dynamic(
  () => import("@/components/landing/mini-charts").then((m) => m.MiniDueChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return <div className="h-[180px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />;
}

export function DashboardChartsSection() {
  const t = useTranslations("messDashboard");

  const charts = [
    { key: "expenseTrend", Chart: MiniExpenseChart },
    { key: "depositTrend", Chart: MiniDepositChart },
    { key: "mealTrend", Chart: MiniMealChart },
    { key: "dueTrend", Chart: MiniDueChart },
  ] as const;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {t("analyticsSection")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {charts.map(({ key, Chart }, i) => (
          <Card
            key={key}
            className="overflow-hidden border-zinc-200/80 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t(key)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <Chart />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

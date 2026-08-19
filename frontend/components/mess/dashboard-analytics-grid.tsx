"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartPoint = {
  label: string;
  value: number;
};

type DashboardAnalyticsGridProps = {
  expenseTrend: ChartPoint[];
  depositTrend: ChartPoint[];
  mealTrend: ChartPoint[];
  dueTrend: ChartPoint[];
  utilityTrend: ChartPoint[];
  bazaarTrend: ChartPoint[];
};

function ChartShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
          {title}
        </CardTitle>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="h-[260px] min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  const t = useTranslations("messDashboard");
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800">
      {t("emptyChart")}
    </div>
  );
}

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-semibold text-zinc-900 dark:text-white">{label}</p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-300">
        {payload[0].value?.toLocaleString("en-US")}
      </p>
    </div>
  );
}

export function DashboardAnalyticsGrid({
  expenseTrend,
  depositTrend,
  mealTrend,
  dueTrend,
  utilityTrend,
  bazaarTrend,
}: DashboardAnalyticsGridProps) {
  const t = useTranslations("messDashboard");

  const commonAxis = {
    tickLine: false,
    axisLine: false,
    fontSize: 12,
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {t("analyticsSection")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("analyticsSubtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartShell title={t("expenseTrend")} subtitle={t("expenseTrendSubtitle")}>
          {expenseTrend.length ? (
            <LineChart data={expenseTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="label" {...commonAxis} minTickGap={20} />
              <YAxis {...commonAxis} width={36} />
              <Tooltip content={<MoneyTooltip />} />
              <Line
                dataKey="value"
                type="monotone"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          ) : (
            <EmptyChart />
          )}
        </ChartShell>

        <ChartShell title={t("depositTrend")} subtitle={t("depositTrendSubtitle")}>
          {depositTrend.length ? (
            <LineChart data={depositTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="label" {...commonAxis} minTickGap={20} />
              <YAxis {...commonAxis} width={36} />
              <Tooltip content={<MoneyTooltip />} />
              <Line
                dataKey="value"
                type="monotone"
                stroke="#14b8a6"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          ) : (
            <EmptyChart />
          )}
        </ChartShell>

        <ChartShell title={t("mealTrend")} subtitle={t("mealTrendSubtitle")}>
          {mealTrend.length ? (
            <BarChart data={mealTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="label" {...commonAxis} minTickGap={20} />
              <YAxis {...commonAxis} width={36} />
              <Tooltip content={<MoneyTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <EmptyChart />
          )}
        </ChartShell>

        <ChartShell title={t("dueTrend")} subtitle={t("dueTrendSubtitle")}>
          {dueTrend.length ? (
            <BarChart data={dueTrend} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
              <XAxis type="number" {...commonAxis} />
              <YAxis type="category" dataKey="label" {...commonAxis} width={88} />
              <Tooltip content={<MoneyTooltip />} />
              <Bar dataKey="value" fill="#f97316" radius={[0, 6, 6, 0]} />
            </BarChart>
          ) : (
            <EmptyChart />
          )}
        </ChartShell>

        <ChartShell title={t("utilityBillsTrend")} subtitle={t("utilityBillsTrendSubtitle")}>
          {utilityTrend.length ? (
            <BarChart data={utilityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="label" {...commonAxis} />
              <YAxis {...commonAxis} width={36} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend />
              <Bar dataKey="value" name={t("currentMonthCost")} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <EmptyChart />
          )}
        </ChartShell>

        <ChartShell title={t("bazaarCostTrend")} subtitle={t("bazaarCostTrendSubtitle")}>
          {bazaarTrend.length ? (
            <LineChart data={bazaarTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="label" {...commonAxis} minTickGap={20} />
              <YAxis {...commonAxis} width={36} />
              <Tooltip content={<MoneyTooltip />} />
              <Line
                dataKey="value"
                type="monotone"
                stroke="#0f766e"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          ) : (
            <EmptyChart />
          )}
        </ChartShell>
      </div>
    </section>
  );
}

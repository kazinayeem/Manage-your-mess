"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Analytics = {
  totalCost: number;
  totalBudget: number;
  monthlyCost: number;
  avgCost: number;
  taskCount: number;
  budgetVariance: number;
  mostActiveShopper: { name: string; count: number; cost: number } | null;
  memberWise: { memberId: string; name: string; cost: number; count: number }[];
  monthlyTrend: { month: string; budget: number; actual: number }[];
};

export function BazaarAnalytics({ data }: { data: Analytics }) {
  const t = useTranslations("bazaar");

  const kpis = [
    { label: t("totalBazaarCost"), value: formatCurrency(data.totalCost) },
    { label: t("monthlyBazaarCost"), value: formatCurrency(data.monthlyCost) },
    { label: t("avgBazaarCost"), value: formatCurrency(data.avgCost) },
    { label: t("budgetVariance"), value: formatCurrency(data.budgetVariance) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-zinc-500">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.mostActiveShopper && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">{t("mostActiveShopper")}</p>
            <p className="text-lg font-semibold">
              {data.mostActiveShopper.name} — {data.mostActiveShopper.count} {t("tasks")} (
              {formatCurrency(data.mostActiveShopper.cost)})
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("budgetVsActual")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="budget" name={t("budget")} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name={t("actual")} fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("memberWiseCost")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.memberWise.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="cost" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

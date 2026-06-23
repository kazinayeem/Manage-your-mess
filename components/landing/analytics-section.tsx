"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";
import {
  depositTrend,
  expenseTrend,
  getChartMonths,
  healthScore,
  mealTrend,
  memberGrowth,
  utilityCost,
} from "@/lib/landing/chart-data";
import { MiniDepositChart, MiniExpenseChart, MiniMealChart, MiniMemberChart } from "./mini-charts";

const COLORS = ["#059669", "#3b82f6", "#8b5cf6", "#f59e0b"];

export function LandingAnalytics() {
  const t = useTranslations("landing.analytics");
  const locale = useLocale();
  const months = getChartMonths(locale);

  const utilityData = utilityCost.map((u) => ({
    name: t(`utility.${u.name}`),
    value: u.value,
  }));

  const healthData = healthScore.map((h) => ({
    name: t(`health.${h.label}`),
    value: h.value,
  }));

  const collectionRate = depositTrend.map((d, i) => ({
    name: months[d.month],
    rate: [74, 78, 81, 84, 87, 90][i] ?? 85,
  }));

  return (
    <SectionShell
      id="analytics"
      className="bg-gradient-to-b from-white via-emerald-50/40 to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950"
    >
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        center
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[
          { title: t("charts.expenses"), chart: <MiniExpenseChart /> },
          { title: t("charts.deposits"), chart: <MiniDepositChart /> },
          { title: t("charts.meals"), chart: <MiniMealChart /> },
          { title: t("charts.members"), chart: <MiniMemberChart /> },
          {
            title: t("charts.utility"),
            chart: (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={utilityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {utilityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ),
          },
          {
            title: t("charts.collection"),
            chart: (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={collectionRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ),
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{item.title}</h3>
            {item.chart}
          </div>
        ))}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm md:col-span-2 xl:col-span-3 dark:border-emerald-800/50 dark:bg-emerald-950/30">
          <h3 className="mb-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t("charts.health")}</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            {healthData.map((h) => (
              <div key={h.name} className="text-center">
                <div className="relative mx-auto h-20 w-20">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#d4d4d8" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${h.value} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-zinc-900 dark:text-white">
                    {h.value}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{h.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

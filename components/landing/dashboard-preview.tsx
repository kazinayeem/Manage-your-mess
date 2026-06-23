"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";
import {
  MiniDepositChart,
  MiniDueChart,
  MiniExpenseChart,
  MiniMealChart,
  MiniMemberChart,
} from "@/components/landing/mini-charts";
import { cn } from "@/lib/utils";
import { AppScreenshot } from "@/components/landing/app-screenshot";
import { DASHBOARD_TAB_SCREENSHOTS, MARKETING_SCREENSHOTS } from "@/lib/marketing-images";

const tabs = ["dashboard", "meals", "expenses", "deposits", "reports", "analytics"] as const;

const chartMap = {
  dashboard: MiniMemberChart,
  meals: MiniMealChart,
  expenses: MiniExpenseChart,
  deposits: MiniDepositChart,
  reports: MiniDueChart,
  analytics: MiniExpenseChart,
};

export function LandingDashboardPreview() {
  const t = useTranslations("landing.dashboard");
  const [active, setActive] = useState<(typeof tabs)[number]>("dashboard");
  const Chart = chartMap[active];
  const screenshotSrc = DASHBOARD_TAB_SCREENSHOTS[active] ?? "/1.png";
  const screenshotAlt =
    MARKETING_SCREENSHOTS.find((s) => s.src === screenshotSrc)?.alt ?? "BornoMess screenshot";

  return (
    <SectionShell id="preview" className="bg-zinc-50 dark:bg-zinc-900/40">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 p-2 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active === tab
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <p className="mb-4 text-sm font-medium text-zinc-500">{t(`chartLabels.${active}`)}</p>
                <AppScreenshot src={screenshotSrc} alt={screenshotAlt} className="mb-4" />
                <Chart />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            {(["kpi1", "kpi2", "kpi3", "kpi4"] as const).map((kpi) => (
              <div
                key={kpi}
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs text-zinc-500">{t(`kpis.${kpi}.label`)}</p>
                <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                  {t(`kpis.${kpi}.value`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

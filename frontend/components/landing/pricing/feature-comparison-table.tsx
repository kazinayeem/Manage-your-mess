"use client";

import { useTranslations } from "next-intl";
import { Check, Minus, HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { formatPlanDuration, type ParsedPlan } from "@/lib/billing/plan-utils";
import {
  COMPARISON_ROWS,
  getComparisonValue,
  sortPlansForDisplay,
  type ComparisonValue,
} from "@/lib/pricing-comparison";
import { cn } from "@/lib/utils";

function CellContent({ value }: { value: ComparisonValue }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label="Included" />;
  }
  return <Minus className="mx-auto h-5 w-5 text-zinc-300 dark:text-zinc-600" aria-label="Not included" />;
}

export function PricingFeatureTable({ plans }: { plans: ParsedPlan[] }) {
  const t = useTranslations("landing.pricing");
  const sorted = sortPlansForDisplay(plans);

  return (
    <div className="space-y-4">
      <div className="text-center md:text-left">
        <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {t("compareTitle")}
        </h3>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("compareSubtitle")}</p>
      </div>

      {/* Desktop & tablet: sticky header table */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-xl shadow-zinc-900/5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 md:block">
        <div className="table-scroll-x overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/95 dark:border-zinc-800 dark:bg-zinc-900/95">
                <th className="sticky left-0 z-20 min-w-[200px] bg-zinc-50/95 p-4 text-left font-semibold text-zinc-500 backdrop-blur-sm dark:bg-zinc-900/95">
                  {t("feature")}
                </th>
                {sorted.map((plan) => (
                  <th
                    key={plan.id}
                    className={cn(
                      "min-w-[140px] p-4 text-center",
                      plan.isPopular && "bg-emerald-50/80 dark:bg-emerald-950/30"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {plan.isPopular && (
                        <Badge variant="secondary" className="mb-1 text-[10px]">
                          {t("popular")}
                        </Badge>
                      )}
                      <span className="font-semibold text-zinc-900 dark:text-white">{plan.name}</span>
                      <span className="text-base font-bold text-emerald-600">
                        {plan.slug === "enterprise"
                          ? t("custom")
                          : formatCurrency(plan.price, plan.currency)}
                      </span>
                      {plan.price > 0 && plan.slug !== "enterprise" && (
                        <span className="text-[10px] text-zinc-500">/ {formatPlanDuration(plan)}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => {
                const Icon = row.icon;
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-zinc-100 transition-colors hover:bg-zinc-50/80 dark:border-zinc-800/80 dark:hover:bg-zinc-900/50",
                      i % 2 === 0 && "bg-white/50 dark:bg-zinc-950/30"
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-inherit p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300">
                        <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{t(`rows.${row.id}`)}</span>
                        <Tooltip content={t(`tooltips.${row.id}`)}>
                          <HelpCircle className="h-3.5 w-3.5 cursor-help text-zinc-400" />
                        </Tooltip>
                      </div>
                    </td>
                    {sorted.map((plan) => (
                      <td
                        key={plan.id}
                        className={cn(
                          "p-4 text-center",
                          plan.isPopular && "bg-emerald-50/40 dark:bg-emerald-950/20"
                        )}
                      >
                        <CellContent value={getComparisonValue(plan, row.id, t)} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: horizontal scroll comparison */}
      <div className="md:hidden">
        <p className="mb-2 text-center text-xs text-zinc-500">{t("swipeHint")}</p>
        <div className="table-scroll-x -mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] rounded-xl border border-zinc-200/80 bg-white/90 text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-950/90">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="sticky left-0 z-10 bg-white p-3 text-left dark:bg-zinc-950">{t("feature")}</th>
                {sorted.map((plan) => (
                  <th key={plan.id} className="p-3 text-center font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="sticky left-0 z-10 bg-white p-3 font-medium dark:bg-zinc-950">
                    {t(`rows.${row.id}`)}
                  </td>
                  {sorted.map((plan) => (
                    <td key={plan.id} className="p-3 text-center">
                      <CellContent value={getComparisonValue(plan, row.id, t)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

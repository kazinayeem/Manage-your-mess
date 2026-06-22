"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";
import { formatCurrency } from "@/lib/utils";
import { formatPlanDuration, type ParsedPlan } from "@/lib/billing/plan-utils";
import type { PlanFeatureKey } from "@/lib/billing/constants";

type RowKey =
  | "members"
  | "pdf"
  | "excel"
  | "ai"
  | "branches"
  | "reports"
  | "support"
  | "storage";

function hasFeature(plan: ParsedPlan, key: PlanFeatureKey) {
  return plan.features.includes(key);
}

function cellValue(plan: ParsedPlan, row: RowKey, t: (key: string) => string) {
  switch (row) {
    case "members":
      return plan.maxMembers === -1 ? t("unlimited") : String(plan.maxMembers);
    case "pdf":
      return hasFeature(plan, "pdf_reports") ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : <Minus className="mx-auto h-5 w-5 text-zinc-300" />;
    case "excel":
      return hasFeature(plan, "excel_reports") ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : <Minus className="mx-auto h-5 w-5 text-zinc-300" />;
    case "ai":
      return hasFeature(plan, "ai_analytics") ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : <Minus className="mx-auto h-5 w-5 text-zinc-300" />;
    case "branches":
      return plan.limits.branches === -1 ? t("unlimited") : String(plan.limits.branches ?? 1);
    case "reports":
      return hasFeature(plan, "advanced_reports") ? t("advanced") : t("basic");
    case "support":
      return hasFeature(plan, "priority_support") ? t("priority") : t("standard");
    case "storage":
      return plan.limits.storage_mb === -1 ? t("unlimited") : `${plan.limits.storage_mb ?? 100} MB`;
    default:
      return null;
  }
}

const rows: RowKey[] = ["members", "pdf", "excel", "ai", "branches", "reports", "support", "storage"];

export function LandingPlanComparison({
  plans,
  isLoggedIn,
}: {
  plans: ParsedPlan[];
  isLoggedIn: boolean;
}) {
  const t = useTranslations("landing.pricing");

  return (
    <SectionShell id="pricing" className="bg-zinc-50 dark:bg-zinc-900/40">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="p-4 text-left font-medium text-zinc-500">{t("feature")}</th>
              {plans.map((plan) => (
                <th key={plan.id} className="p-4 text-center">
                  <div className="relative inline-flex flex-col items-center gap-1">
                    {plan.isPopular && (
                      <Badge className="absolute -top-6 whitespace-nowrap">{t("popular")}</Badge>
                    )}
                    <span className="font-semibold text-zinc-900 dark:text-white">{plan.name}</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {plan.price === 0 && plan.slug === "enterprise"
                        ? t("custom")
                        : formatCurrency(plan.price, plan.currency)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-zinc-500">/ {formatPlanDuration(plan)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-b border-zinc-100 dark:border-zinc-800/80">
                <td className="p-4 font-medium text-zinc-700 dark:text-zinc-300">{t(`rows.${row}`)}</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-4 text-center text-zinc-600 dark:text-zinc-400">
                    {cellValue(plan, row, t)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4" />
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  <Button
                    size="sm"
                    variant={plan.isPopular ? "default" : "outline"}
                    className="w-full max-w-[140px]"
                    asChild
                  >
                    <Link
                      href={
                        plan.slug === "enterprise"
                          ? "/contact"
                          : isLoggedIn
                            ? `/pricing/subscribe/${plan.id}`
                            : "/register"
                      }
                    >
                      {plan.slug === "enterprise" ? t("contact") : t("choose")}
                    </Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

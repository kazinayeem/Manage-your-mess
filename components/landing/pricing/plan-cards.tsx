"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { formatPlanDuration, type ParsedPlan } from "@/lib/billing/plan-utils";
import {
  getPlanCtaHref,
  getPlanCtaLabel,
  PLAN_CARD_SLUGS,
  type PlanCardSlug,
} from "@/lib/pricing-comparison";
import { cn } from "@/lib/utils";

const CARD_FEATURES: Record<PlanCardSlug, string[]> = {
  free: ["meal", "deposit", "expense", "monthly", "basic_reports", "no_pdf", "no_excel", "no_analytics", "no_bills"],
  pro: [
    "all_free",
    "pdf",
    "excel",
    "bills",
    "bazaar",
    "portal",
    "advanced_reports",
    "priority_support",
  ],
  business: [
    "all_pro",
    "multi_branch",
    "room",
    "bed",
    "visitor",
    "advanced_analytics",
    "branding",
    "audit",
  ],
  enterprise: [
    "all",
    "unlimited_branches",
    "unlimited_storage",
    "ai",
    "dedicated_support",
    "sla",
    "api",
    "integrations",
    "white_label",
    "account_manager",
  ],
};

function PlanPrice({ plan, t }: { plan: ParsedPlan; t: (key: string) => string }) {
  if (plan.slug === "enterprise") {
    return (
      <>
        <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          {t("custom")}
        </span>
        <p className="mt-1 text-sm text-zinc-500">{t("cards.enterprise.priceHint")}</p>
      </>
    );
  }
  return (
    <>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          {formatCurrency(plan.price, plan.currency)}
        </span>
        {plan.price > 0 && (
          <span className="text-sm font-medium text-zinc-500">/ {formatPlanDuration(plan)}</span>
        )}
      </div>
    </>
  );
}

export function PricingPlanCards({
  plans,
  isLoggedIn,
}: {
  plans: ParsedPlan[];
  isLoggedIn: boolean;
}) {
  const t = useTranslations("landing.pricing");

  const ordered = PLAN_CARD_SLUGS.map((slug) => plans.find((p) => p.slug === slug)).filter(
    Boolean
  ) as ParsedPlan[];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {ordered.map((plan, index) => {
        const slug = plan.slug as PlanCardSlug;
        const features = CARD_FEATURES[slug] ?? [];
        const isPopular = plan.isPopular || slug === "pro";
        const descriptionKey = `cards.${slug}.description` as const;
        const memberKey = `cards.${slug}.members` as const;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6 sm:p-7",
              "bg-white/80 shadow-lg shadow-zinc-900/5 backdrop-blur-xl",
              "dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:shadow-black/30",
              isPopular
                ? "border-emerald-500/60 ring-2 ring-emerald-500/20 dark:border-emerald-500/40"
                : "border-zinc-200/80 hover:border-zinc-300 dark:hover:border-zinc-700"
            )}
          >
            {isPopular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 px-3 shadow-md">
                {t("popular")}
              </Badge>
            )}

            <div className="mb-6 space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{plan.name}</h3>
              <PlanPrice plan={plan} t={t} />
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(descriptionKey)}
              </p>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t(memberKey)}
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-2.5">
              {features.map((feat) => {
                const isNegative = feat.startsWith("no_");
                const labelKey = `cards.features.${feat}` as const;
                return (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    {isNegative ? (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
                    ) : (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    <span
                      className={cn(
                        isNegative ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      {t(labelKey)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <Button
              size="lg"
              variant={isPopular ? "default" : "outline"}
              className={cn(
                "h-12 w-full text-base font-semibold",
                isPopular && "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700"
              )}
              asChild
            >
              <Link href={getPlanCtaHref(plan, isLoggedIn)}>{getPlanCtaLabel(plan, t)}</Link>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

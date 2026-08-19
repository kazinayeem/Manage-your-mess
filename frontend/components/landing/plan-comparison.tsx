"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";
import { Button } from "@/components/ui/button";
import type { ParsedPlan } from "@/lib/billing/plan-utils";
import { PricingPlanCards } from "@/components/landing/pricing/plan-cards";
import { PricingFeatureTable } from "@/components/landing/pricing/feature-comparison-table";
import { PricingTrustSection } from "@/components/landing/pricing/pricing-trust";

export function LandingPlanComparison({
  plans,
  isLoggedIn,
  showPageHero = false,
}: {
  plans: ParsedPlan[];
  isLoggedIn: boolean;
  showPageHero?: boolean;
}) {
  const t = useTranslations("landing.pricing");

  return (
    <>
      {showPageHero && (
        <section className="relative overflow-hidden border-b border-zinc-200/80 bg-gradient-to-b from-emerald-50/80 via-white to-white py-16 dark:border-zinc-800 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-zinc-950 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(20,184,166,0.12), transparent 35%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold uppercase tracking-widest text-emerald-600"
            >
              {t("eyebrow")}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 font-display text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white"
            >
              {t("pageTitle")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400"
            >
              {t("pageSubtitle")}
            </motion.p>
          </div>
        </section>
      )}

      <SectionShell
        id="pricing"
        className="relative overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/50"
      >
        <div
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl"
          aria-hidden
        />

        {!showPageHero && (
          <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        )}

        {showPageHero && (
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
              {t("title")}
            </h2>
            <p className="mt-2 text-zinc-500">{t("subtitle")}</p>
          </div>
        )}

        <PricingPlanCards plans={plans} isLoggedIn={isLoggedIn} />

        <div className="mt-20" id="compare">
          <PricingFeatureTable plans={plans} />
        </div>

        <div className="mt-20">
          <PricingTrustSection />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" className="h-12 min-w-[200px] px-8 text-base font-semibold" asChild>
            <Link href={isLoggedIn ? "/portal/create-mess" : "/register"}>{t("cta.startFree")}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 min-w-[200px] border-emerald-200 px-8 text-base font-semibold dark:border-emerald-900"
            asChild
          >
            <Link href={showPageHero ? "#compare" : "/pricing"}>{t("cta.upgradeNow")}</Link>
          </Button>
          <Button size="lg" variant="secondary" className="h-12 min-w-[200px] px-8 text-base font-semibold" asChild>
            <Link href="/contact">{t("cta.contactSales")}</Link>
          </Button>
        </motion.div>
      </SectionShell>
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { SectionShell } from "@/components/landing/section-shell";

const statKeys = ["members", "messes", "meals", "amount"] as const;

export function LandingTrust() {
  const t = useTranslations("landing.trust");

  return (
    <SectionShell className="border-y border-zinc-100 bg-zinc-50/80 py-16 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {statKeys.map((key) => (
          <div key={key} className="text-center">
            <p className="text-3xl font-bold text-emerald-600 sm:text-4xl lg:text-5xl">
              <AnimatedCounter value={t(`stats.${key}.value`)} />
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-600 sm:text-base dark:text-zinc-400">
              {t(`stats.${key}.label`)}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";

export function LandingWhy() {
  const t = useTranslations("landing.why");

  const problems = ["excel", "manual", "lost", "due", "conflict"] as const;
  const solutions = ["auto", "reports", "dueTrack", "mobile", "transparent"] as const;

  return (
    <SectionShell id="why">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-red-100 bg-red-50/50 p-8 dark:border-red-900/30 dark:bg-red-950/20"
        >
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">{t("oldTitle")}</h3>
          <ul className="mt-6 space-y-4">
            {problems.map((key) => (
              <li key={key} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <X className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                {t(`problems.${key}`)}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 dark:border-emerald-900/30 dark:bg-emerald-950/20"
        >
          <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">{t("newTitle")}</h3>
          <ul className="mt-6 space-y-4">
            {solutions.map((key) => (
              <li key={key} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                {t(`solutions.${key}`)}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </SectionShell>
  );
}

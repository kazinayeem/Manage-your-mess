"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";

const steps = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export function LandingHowItWorks() {
  const t = useTranslations("landing.howItWorks");

  return (
    <SectionShell id="how-it-works" className="bg-zinc-50 dark:bg-zinc-900/40">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="relative mx-auto max-w-3xl">
        <div className="absolute left-6 top-0 hidden h-full w-0.5 bg-emerald-200 sm:block dark:bg-emerald-800" />
        <ol className="space-y-8">
          {steps.map((step, i) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative flex gap-6 sm:pl-2"
            >
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/30">
                {i + 1}
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="font-semibold text-zinc-900 dark:text-white">{t(`steps.${step}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t(`steps.${step}.desc`)}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}

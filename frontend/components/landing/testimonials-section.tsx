"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";

const reviews = ["r1", "r2", "r3", "r4"] as const;

export function LandingTestimonials() {
  const t = useTranslations("landing.testimonials");

  return (
    <SectionShell id="testimonials">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 md:grid-cols-2">
        {reviews.map((key, i) => (
          <motion.blockquote
            key={key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              &ldquo;{t(`items.${key}.quote`)}&rdquo;
            </p>
            <footer className="mt-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {t(`items.${key}.initials`)}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">{t(`items.${key}.name`)}</p>
                <p className="text-sm text-zinc-500">{t(`items.${key}.role`)}</p>
              </div>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </SectionShell>
  );
}

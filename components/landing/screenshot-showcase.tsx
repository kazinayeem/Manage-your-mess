"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { MARKETING_SCREENSHOTS } from "@/lib/marketing-images";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";

export function LandingScreenshotShowcase() {
  const t = useTranslations("landing.showcase");

  return (
    <SectionShell id="showcase" className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
          {MARKETING_SCREENSHOTS.map((shot, i) => (
            <motion.figure
              key={shot.src}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group w-[72vw] shrink-0 sm:w-auto"
            >
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-md transition-shadow group-hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={800}
                  height={500}
                  className="aspect-[16/10] w-full object-cover object-top"
                  sizes="(max-width: 640px) 72vw, 33vw"
                />
              </div>
              <figcaption className="mt-2 text-center text-xs text-zinc-500 sm:text-sm">
                {t(`shots.${i + 1}`)}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

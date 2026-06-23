"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { Smartphone, Download, Bell, Zap, WifiOff } from "lucide-react";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";
import { MOBILE_PREVIEW_SCREENSHOT } from "@/lib/marketing-images";

const highlights = [
  { key: "responsive", icon: Smartphone },
  { key: "mobile", icon: Smartphone },
  { key: "pwa", icon: Download },
  { key: "push", icon: Bell },
  { key: "fast", icon: Zap },
  { key: "offline", icon: WifiOff },
] as const;

export function LandingMobile() {
  const t = useTranslations("landing.mobile");

  return (
    <SectionShell id="mobile" className="overflow-hidden bg-zinc-50 dark:bg-zinc-900/40">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          center={false}
        />

        <div className="relative mx-auto flex justify-center lg:order-first">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="relative w-[260px] rounded-[2.5rem] border-[10px] border-zinc-900 bg-zinc-900 p-2 shadow-2xl dark:border-zinc-700"
          >
            <div className="overflow-hidden rounded-[1.75rem] bg-white dark:bg-zinc-950">
              <Image
                src={MOBILE_PREVIEW_SCREENSHOT}
                alt="BornoMess Manager mobile workspace"
                width={390}
                height={780}
                className="h-auto w-full object-cover object-top"
                sizes="260px"
                priority
              />
              <div className="flex justify-around border-t border-zinc-200 bg-white/95 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
                {["হোম", "খাবার", "রিপোর্ট", "প্রোফাইল"].map((label) => (
                  <span key={label} className="text-[10px] text-emerald-600">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Icon className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium">{t(`highlights.${key}.title`)}</p>
              <p className="mt-1 text-sm text-zinc-500">{t(`highlights.${key}.desc`)}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

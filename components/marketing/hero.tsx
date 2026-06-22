"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Utensils,
  Receipt,
  Wallet,
  BarChart3,
  Smartphone,
  Brain,
  Languages,
  DoorOpen,
} from "lucide-react";

const featureIcons = {
  mealTracking: Utensils,
  expenseManagement: Receipt,
  dueManagement: Wallet,
  depositTracking: Wallet,
  reports: BarChart3,
  mobileFriendly: Smartphone,
  aiAnalytics: Brain,
  multiLanguage: Languages,
  roomManagement: DoorOpen,
};

const featureKeys = Object.keys(featureIcons) as (keyof typeof featureIcons)[];

export function FeaturesGrid() {
  const t = useTranslations("features");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-zinc-500">{t("subtitle")}</p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{t(key)}</h3>
                <p className="mt-2 text-sm text-zinc-500">{t(`${key}Desc`)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  const t = useTranslations("hero");
  const tc = useTranslations("common");

  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-white to-white dark:from-emerald-950/30 dark:via-zinc-950 dark:to-zinc-950" />
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-white"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400"
        >
          {t("subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link href="/register">{t("cta")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">{tc("viewPricing")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

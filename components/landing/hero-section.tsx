"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, MessageCircle } from "lucide-react";
import { AppScreenshot } from "@/components/landing/app-screenshot";
import { MARKETING_COVER } from "@/lib/marketing-images";

export function LandingHero() {
  const t = useTranslations("landing.hero");
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.18),transparent)]" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-4 py-1.5 text-sm font-medium text-emerald-800 backdrop-blur dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t("badge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem] dark:text-white"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <Button size="lg" className="h-12 gap-2 px-6 text-base shadow-lg shadow-emerald-600/20" asChild>
              <Link href="/register">
                {t("ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 gap-2 px-6 text-base" asChild>
              <Link href="/login">
                <Play className="h-4 w-4" />
                {t("ctaDemo")}
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-12 gap-2 px-6 text-base" asChild>
              <Link href="/contact">
                <MessageCircle className="h-4 w-4" />
                {t("ctaContact")}
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative"
        >
          <div className="rounded-2xl border border-white/60 bg-white/40 p-2 shadow-2xl shadow-emerald-900/10 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/40">
            <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="ml-2 text-xs text-zinc-500">bornomess.bornosoft.com</span>
              </div>
              <AppScreenshot
                src={MARKETING_COVER}
                alt="BornoMess Manager — smart mess management dashboard"
                priority
                className="rounded-none border-0 shadow-none"
              />
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -left-4 top-8 hidden rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur sm:block dark:border-zinc-700 dark:bg-zinc-900/90"
          >
            <p className="text-xs text-zinc-500">{t("floatLabel")}</p>
            <p className="font-semibold text-emerald-600">+১২% {locale === "bn" ? "এই মাসে" : "this month"}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

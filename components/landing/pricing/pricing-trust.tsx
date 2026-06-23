"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Lock, Zap, FileText, MessageCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  { key: "secure", icon: Lock, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
  { key: "instant", icon: Zap, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  { key: "invoice", icon: FileText, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/50" },
  { key: "support", icon: MessageCircle, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50" },
  { key: "uptime", icon: Activity, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50" },
] as const;

const PAYMENT_METHODS = [
  { id: "bkash", label: "bKash", className: "from-pink-600 to-rose-600" },
  { id: "nagad", label: "Nagad", className: "from-orange-500 to-amber-600" },
  { id: "rocket", label: "Rocket", className: "from-purple-600 to-violet-600" },
  { id: "bank", label: "Bank Transfer", className: "from-zinc-600 to-zinc-800" },
] as const;

export function PricingTrustSection() {
  const t = useTranslations("landing.pricing");

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TRUST_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white/70 p-5 text-center shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <span className={cn("mb-3 flex h-11 w-11 items-center justify-center rounded-xl", item.color)}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {t(`trust.${item.key}.title`)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t(`trust.${item.key}.desc`)}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-950 sm:p-8">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {t("payments.title")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              className={cn(
                "flex h-14 min-w-[120px] items-center justify-center rounded-xl bg-gradient-to-br px-5 text-sm font-bold text-white shadow-md",
                method.className
              )}
            >
              {method.label}
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500">{t("payments.hint")}</p>
      </div>
    </div>
  );
}

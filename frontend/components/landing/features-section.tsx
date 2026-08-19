"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Utensils,
  Receipt,
  Wallet,
  DoorOpen,
  Bed,
  UserCheck,
  FileText,
  Brain,
  Zap,
  Home,
  Users,
  Shield,
  Bell,
  CreditCard,
  Building2,
  GitBranch,
} from "lucide-react";
import { SectionHeader, SectionShell } from "@/components/landing/section-shell";

const featureIcons = {
  meals: Utensils,
  expenses: Receipt,
  deposits: Wallet,
  rooms: DoorOpen,
  beds: Bed,
  visitors: UserCheck,
  reports: FileText,
  ai: Brain,
  utilities: Zap,
  rent: Home,
  members: Users,
  audit: Shield,
  notifications: Bell,
  subscriptions: CreditCard,
  payments: Wallet,
  multiMess: GitBranch,
  branches: Building2,
} as const;

const featureKeys = Object.keys(featureIcons) as (keyof typeof featureIcons)[];

export function LandingFeatures() {
  const t = useTranslations("landing.features");

  return (
    <SectionShell id="features">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {featureKeys.map((key, i) => {
          const Icon = featureIcons[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 8) * 0.04 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/50">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-white">{t(`items.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t(`items.${key}.desc`)}</p>
            </motion.div>
          );
        })}
      </div>
    </SectionShell>
  );
}

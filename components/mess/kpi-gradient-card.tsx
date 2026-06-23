"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Trend = "up" | "down" | "neutral";

const gradients: Record<string, string> = {
  emerald: "from-emerald-500 to-teal-600",
  sky: "from-sky-500 to-blue-600",
  violet: "from-violet-500 to-purple-600",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-500 to-pink-600",
  slate: "from-zinc-600 to-zinc-800",
};

export function KpiGradientCard({
  label,
  value,
  icon: Icon,
  tone = "emerald",
  trend,
  trendLabel,
  className,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: keyof typeof gradients;
  trend?: Trend;
  trendLabel?: string;
  className?: string;
  delay?: number;
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-[1px] shadow-md shadow-black/5 transition-shadow hover:shadow-lg dark:shadow-black/20",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-100",
          gradients[tone] ?? gradients.emerald
        )}
      />
      <div className="relative flex min-h-[7.5rem] flex-col justify-between rounded-[calc(1rem-1px)] bg-white/95 p-4 backdrop-blur-sm dark:bg-zinc-950/90">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
              gradients[tone] ?? gradients.emerald
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {trend && trendLabel && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                trend === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                trend === "down" && "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
                trend === "neutral" && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trendLabel}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white sm:text-[1.65rem]">
            {value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

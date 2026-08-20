"use client";

import { motion } from "framer-motion";
import { Utensils, Users, Receipt, Wallet, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from "recharts";

const expenseData = [
  { month: "Jan", value: 42 },
  { month: "Feb", value: 58 },
  { month: "Mar", value: 40 },
  { month: "Apr", value: 65 },
  { month: "May", value: 50 },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: "easeOut" as const },
});

const floatCard = (duration: number) => ({
  animate: { y: [0, -8, 0] },
  transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
});

export function AuthShowcase() {
  const max = Math.max(...expenseData.map((d) => d.value));

  return (
    <div className="relative flex h-full min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-10 py-16 dark:from-emerald-950 dark:via-zinc-950 dark:to-teal-950 lg:px-14 xl:px-20">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-600/20" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-600/20" />
      <div className="pointer-events-none absolute right-16 top-20 h-28 w-28 rotate-12 rounded-3xl border border-emerald-200/80 bg-white/40 dark:border-emerald-800 dark:bg-emerald-900/20" />
      <div className="pointer-events-none absolute bottom-40 left-8 h-20 w-20 -rotate-6 rounded-full border-2 border-dashed border-emerald-300/70 dark:border-emerald-700/70" />

      <div className="relative">
        <motion.div {...fadeUp(0)} className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white shadow-lg shadow-emerald-500/30">
            BM
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">BornoMess Manager</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">by BornoSoft</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Live Overview
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white xl:text-[2.75rem] xl:leading-[1.15]"
        >
          Manage Your Mess,
          <br />
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Simply &amp; Smarter.
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.18)}
          className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 xl:text-base"
        >
          Meals, expenses, deposits and mess management — everything in one place.
        </motion.p>

        <div className="relative mt-12 xl:mt-16">
          <motion.div
            {...fadeUp(0.28)}
            className="relative rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-xl shadow-emerald-900/10 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/30 xl:p-7"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Monthly Overview</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </span>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white xl:text-3xl">
                  ৳85,000
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Deposits</p>
              </div>
            </div>

            <div className="mt-5 h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="authExpenseBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    dy={4}
                  />
                  <Bar dataKey="value" radius={[6, 6, 2, 2]} maxBarSize={30}>
                    {expenseData.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={entry.value === max ? "url(#authExpenseBar)" : "#d1fae5"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            {...floatCard(5)}
            className="absolute -right-3 -top-5 flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white/95 py-2.5 pl-3 pr-4 shadow-lg shadow-emerald-900/10 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-black/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">42</p>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Meals Today</p>
            </div>
          </motion.div>

          <motion.div
            {...floatCard(6)}
            className="absolute -bottom-6 left-6 flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white/95 py-2.5 pl-3 pr-4 shadow-lg shadow-emerald-900/10 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-black/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">৳12,500</p>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Expenses</p>
            </div>
          </motion.div>

          <motion.div
            {...floatCard(7)}
            className="absolute -bottom-6 right-10 flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white/95 py-2.5 pl-3 pr-4 shadow-lg shadow-emerald-900/10 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-black/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">36</p>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Active Members</p>
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeUp(0.4)} className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 xl:mt-16">
          {["Meal tracking", "Expense split", "Auto reports"].map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {feature}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

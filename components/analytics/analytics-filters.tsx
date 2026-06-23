"use client";

import type { AnalyticsRange } from "@/actions/analytics";
import { useFilterStore } from "@/stores";
import { cn } from "@/lib/utils";

const RANGES: { value: AnalyticsRange; label: string; labelBn: string }[] = [
  { value: "today", label: "Today", labelBn: "আজ" },
  { value: "week", label: "This Week", labelBn: "এই সপ্তাহ" },
  { value: "month", label: "This Month", labelBn: "এই মাস" },
  { value: "last_month", label: "Last Month", labelBn: "গত মাস" },
  { value: "3months", label: "3 Months", labelBn: "৩ মাস" },
  { value: "6months", label: "6 Months", labelBn: "৬ মাস" },
  { value: "year", label: "This Year", labelBn: "এই বছর" },
];

export function AnalyticsFilters({ locale }: { locale: string }) {
  const range = useFilterStore((s) => s.analyticsRange);
  const setRange = useFilterStore((s) => s.setAnalyticsRange);
  const isBn = locale === "bn";

  return (
    <div className="flex flex-wrap gap-2">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => setRange(r.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            range === r.value
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
          )}
        >
          {isBn ? r.labelBn : r.label}
        </button>
      ))}
    </div>
  );
}

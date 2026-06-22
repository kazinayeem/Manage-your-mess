"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CurrentMonthReportTable, type MonthMemberReportRow } from "@/components/mess/current-month-report-table";
import { BillsTable, type BillRow } from "@/components/mess/bills-table";
import { formatCurrency } from "@/lib/utils";
import { getBillCategoryLabel } from "@/lib/bills/categories";
import type { BillCategoryType } from "@prisma/client";

const TABS = [
  { id: "settlement", label: "Member Settlement" },
  { id: "meals", label: "Meal Cost" },
  { id: "utilities", label: "Utility Bills" },
  { id: "rent", label: "Rent" },
  { id: "shared", label: "Shared Expenses" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MonthDetailsTabs({
  messId,
  members,
  bills,
  billsByCategory,
  mealRate,
  totalMeals,
  totalMealCost,
  labels,
  readOnly = false,
}: {
  messId: string;
  members: MonthMemberReportRow[];
  bills: BillRow[];
  billsByCategory: Partial<Record<BillCategoryType, number>>;
  mealRate: number;
  totalMeals: number;
  totalMealCost: number;
  labels: Record<string, string>;
  readOnly?: boolean;
}) {
  const [tab, setTab] = useState<TabId>("settlement");

  const utilityCats: BillCategoryType[] = ["ELECTRICITY", "WATER", "GAS", "INTERNET", "GENERATOR"];
  const rentBills = bills.filter((b) => b.category === "HOUSE_RENT");
  const utilityBills = bills.filter((b) => utilityCats.includes(b.category));
  const sharedBills = bills.filter(
    (b) => b.category !== "HOUSE_RENT" && !utilityCats.includes(b.category)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation",
              tab === t.id
                ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-300"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "settlement" && (
        <CurrentMonthReportTable members={members} labels={labels} showBillBreakdown />
      )}

      {tab === "meals" && (
        <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Total Meals</p>
              <p className="text-xl font-bold tabular-nums">{totalMeals.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Meal Rate</p>
              <p className="text-xl font-bold tabular-nums">{formatCurrency(mealRate)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Meal Cost</p>
              <p className="text-xl font-bold tabular-nums text-emerald-600">
                {formatCurrency(totalMealCost)}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-500">
            Meal cost is calculated from grocery/bazaar expenses divided by total meals.
          </p>
        </div>
      )}

      {tab === "rent" && <BillsTable messId={messId} bills={rentBills} readOnly={readOnly} />}

      {tab === "utilities" && (
        <BillsTable messId={messId} bills={utilityBills} readOnly={readOnly} />
      )}

      {tab === "shared" && (
        <BillsTable messId={messId} bills={sharedBills} readOnly={readOnly} />
      )}

      {tab !== "settlement" && tab !== "meals" && billsByCategory && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(billsByCategory).map(([cat, amt]) => (
            <div
              key={cat}
              className="flex justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800"
            >
              <span>{getBillCategoryLabel(cat as BillCategoryType)}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(amt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

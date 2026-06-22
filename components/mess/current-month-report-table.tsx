import type { BillShareBreakdown } from "@/lib/bills/categories";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type MonthMemberReportRow = {
  id: string;
  fullName: string | null;
  phone: string | null;
  mealCount: number;
  mealCost: number;
  totalDeposit: number;
  sharedCostShare: number;
  billShares?: BillShareBreakdown;
  due: number;
  advance: number;
  balance: number;
};

export type MonthReportTotals = {
  mealCount: number;
  mealCost: number;
  totalDeposit: number;
  sharedCostShare: number;
  due: number;
  advance: number;
};

type Column = {
  key: keyof MonthMemberReportRow | "totalCost" | "rent" | "electricity" | "water" | "internet" | "otherBills";
  label: string;
  align?: "left" | "right";
  format?: (row: MonthMemberReportRow) => string;
  totalFormat?: (totals: MonthReportTotals) => string;
};

function formatMeals(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

export function CurrentMonthReportTable({
  members,
  labels,
  showBillBreakdown = false,
}: {
  members: MonthMemberReportRow[];
  labels: Record<string, string>;
  showBillBreakdown?: boolean;
}) {
  const totals = members.reduce<MonthReportTotals>(
    (acc, m) => ({
      mealCount: acc.mealCount + m.mealCount,
      mealCost: acc.mealCost + m.mealCost,
      totalDeposit: acc.totalDeposit + m.totalDeposit,
      sharedCostShare: acc.sharedCostShare + m.sharedCostShare,
      due: acc.due + m.due,
      advance: acc.advance + m.advance,
    }),
    { mealCount: 0, mealCost: 0, totalDeposit: 0, sharedCostShare: 0, due: 0, advance: 0 }
  );

  const columns: Column[] = [
    {
      key: "fullName",
      label: labels.member,
      align: "left",
      format: (r) => r.fullName ?? labels.unnamed,
    },
    {
      key: "mealCount",
      label: labels.meals,
      align: "right",
      format: (r) => formatMeals(r.mealCount),
      totalFormat: (t) => formatMeals(t.mealCount),
    },
    {
      key: "mealCost",
      label: labels.mealCost,
      align: "right",
      format: (r) => formatCurrency(r.mealCost),
      totalFormat: (t) => formatCurrency(t.mealCost),
    },
    {
      key: "totalDeposit",
      label: labels.deposit,
      align: "right",
      format: (r) => formatCurrency(r.totalDeposit),
      totalFormat: (t) => formatCurrency(t.totalDeposit),
    },
    {
      key: "sharedCostShare",
      label: labels.sharedCost,
      align: "right",
      format: (r) => formatCurrency(r.sharedCostShare),
      totalFormat: (t) => formatCurrency(t.sharedCostShare),
    },
    ...(showBillBreakdown
      ? ([
          {
            key: "rent" as const,
            label: labels.rent ?? "Rent",
            align: "right" as const,
            format: (r: MonthMemberReportRow) => formatCurrency(r.billShares?.rent ?? 0),
          },
          {
            key: "electricity" as const,
            label: labels.electricity ?? "Electricity",
            align: "right" as const,
            format: (r: MonthMemberReportRow) => formatCurrency(r.billShares?.electricity ?? 0),
          },
          {
            key: "water" as const,
            label: labels.water ?? "Water",
            align: "right" as const,
            format: (r: MonthMemberReportRow) => formatCurrency(r.billShares?.water ?? 0),
          },
          {
            key: "internet" as const,
            label: labels.internet ?? "Internet",
            align: "right" as const,
            format: (r: MonthMemberReportRow) => formatCurrency(r.billShares?.internet ?? 0),
          },
          {
            key: "otherBills" as const,
            label: labels.otherShare ?? "Other",
            align: "right" as const,
            format: (r: MonthMemberReportRow) =>
              formatCurrency((r.billShares?.maintenance ?? 0) + (r.billShares?.other ?? 0) + (r.billShares?.gas ?? 0)),
          },
        ] as Column[])
      : []),
    {
      key: "totalCost",
      label: labels.totalCost,
      align: "right",
      format: (r) => formatCurrency(r.mealCost + r.sharedCostShare),
      totalFormat: (t) => formatCurrency(t.mealCost + t.sharedCostShare),
    },
    {
      key: "due",
      label: labels.due,
      align: "right",
      format: (r) => formatCurrency(r.due),
      totalFormat: (t) => formatCurrency(t.due),
    },
    {
      key: "advance",
      label: labels.advance,
      align: "right",
      format: (r) => formatCurrency(r.advance),
      totalFormat: (t) => formatCurrency(t.advance),
    },
    {
      key: "balance",
      label: labels.balance,
      align: "right",
      format: (r) => formatCurrency(r.balance),
    },
  ];

  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
        {labels.noMembers}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
        {labels.memberReport}
      </h2>

      {/* Desktop-style table with horizontal scroll on small screens */}
      <div className="table-scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
            <table className={cn("w-full border-collapse text-sm", showBillBreakdown ? "min-w-[1100px]" : "min-w-[800px]")}>
              <thead>
                <tr className="bg-emerald-600 text-white">
                  {columns.map((col, i) => (
                    <th
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide",
                        col.align === "right" ? "text-right" : "text-left",
                        i === 0 &&
                          "sticky-safari left-0 z-20 bg-emerald-600 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((row, rowIdx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-zinc-100 dark:border-zinc-800",
                      rowIdx % 2 === 0
                        ? "bg-white dark:bg-zinc-950"
                        : "bg-zinc-50/80 dark:bg-zinc-900/50"
                    )}
                  >
                    {columns.map((col, i) => {
                      const value = col.format?.(row) ?? String(row[col.key as keyof MonthMemberReportRow] ?? "");
                      const isDue = col.key === "due" && row.due > 0;
                      const isAdvance = col.key === "advance" && row.advance > 0;

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "whitespace-nowrap px-3 py-2.5 tabular-nums",
                            col.align === "right" ? "text-right" : "text-left",
                            i === 0 &&
                              "sticky-safari left-0 z-10 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
                            i === 0 &&
                              (rowIdx % 2 === 0
                                ? "bg-white dark:bg-zinc-950"
                                : "bg-zinc-50/80 dark:bg-zinc-900/50"),
                            isDue && "font-semibold text-red-600",
                            isAdvance && "font-semibold text-emerald-600"
                          )}
                        >
                          {i === 0 ? (
                            <div>
                              <span className="block max-w-[140px] truncate sm:max-w-[180px]">
                                {value}
                              </span>
                              {row.phone && (
                                <span className="block truncate text-xs font-normal text-zinc-400">
                                  {row.phone}
                                </span>
                              )}
                            </div>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-200 bg-emerald-50 font-semibold dark:border-emerald-900 dark:bg-emerald-950/40">
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-3 tabular-nums text-emerald-900 dark:text-emerald-100",
                        col.align === "right" ? "text-right" : "text-left",
                        i === 0 &&
                          "sticky-safari left-0 z-10 bg-emerald-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:bg-emerald-950/40"
                      )}
                    >
                      {i === 0
                        ? labels.total
                        : col.totalFormat
                          ? col.totalFormat(totals)
                          : col.key === "balance"
                            ? "—"
                            : ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400">{labels.scrollHint}</p>
    </div>
  );
}

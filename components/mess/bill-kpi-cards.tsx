import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type BillKpis = {
  totalRent: number;
  totalUtilities: number;
  totalMealCost: number;
  totalSharedBills: number;
  totalDeposits: number;
  totalDue: number;
  messBalance: number;
};

export function BillKpiCards({ kpis }: { kpis: BillKpis }) {
  const items = [
    { label: "Total Rent", value: kpis.totalRent, color: "text-violet-600" },
    { label: "Utility Cost", value: kpis.totalUtilities, color: "text-sky-600" },
    { label: "Meal Cost", value: kpis.totalMealCost, color: "text-emerald-600" },
    { label: "Shared Bills", value: kpis.totalSharedBills, color: "text-amber-600" },
    { label: "Total Deposits", value: kpis.totalDeposits, color: "text-teal-600" },
    { label: "Total Due", value: kpis.totalDue, color: "text-red-600" },
    { label: "Mess Balance", value: kpis.messBalance, color: "text-zinc-800 dark:text-zinc-200" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <Card key={item.label} className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${item.color}`}>
              {formatCurrency(item.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

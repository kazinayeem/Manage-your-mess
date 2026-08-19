import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, Utensils, Receipt, Wallet, TrendingUp, AlertCircle } from "lucide-react";

interface MonthStatsProps {
  stats: {
    totalMembers: number;
    totalMeals: number;
    totalExpenses: number;
    totalDeposits: number;
    mealRate: number;
    totalDue: number;
    monthLabel?: string;
  };
}

export function MonthStats({ stats }: MonthStatsProps) {
  const items = [
    { label: "Members", value: stats.totalMembers.toString(), icon: Users },
    { label: "Total Meals", value: stats.totalMeals.toString(), icon: Utensils },
    { label: "Total Cost", value: formatCurrency(stats.totalExpenses), icon: Receipt },
    { label: "Deposits", value: formatCurrency(stats.totalDeposits), icon: Wallet },
    { label: "Meal Rate", value: formatCurrency(stats.mealRate), icon: TrendingUp },
    { label: "Total Due", value: formatCurrency(stats.totalDue), icon: AlertCircle },
  ];

  return (
    <div className="space-y-4">
      {stats.monthLabel && (
        <h2 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
          {stats.monthLabel}
        </h2>
      )}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <Icon className="h-4 w-4 text-emerald-600" />
              <p className="mt-2 text-xl font-bold">{value}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

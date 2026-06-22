"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, Utensils, Receipt, Wallet, TrendingUp, AlertCircle } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalMembers: number;
    totalMeals: number;
    monthlyExpenses: number;
    monthlyDeposits: number;
    mealRate: number;
    totalDue: number;
    expenseTrend: { month: string; amount: number }[];
    depositTrend: { month: string; amount: number }[];
  };
}

const kpiConfig = [
  { key: "totalMembers" as const, label: "Total Members", icon: Users, format: (v: number) => v.toString() },
  { key: "totalMeals" as const, label: "Total Meals", icon: Utensils, format: (v: number) => v.toString() },
  { key: "monthlyExpenses" as const, label: "Monthly Expenses", icon: Receipt, format: formatCurrency },
  { key: "monthlyDeposits" as const, label: "Monthly Deposits", icon: Wallet, format: formatCurrency },
  { key: "mealRate" as const, label: "Meal Rate", icon: TrendingUp, format: formatCurrency },
  { key: "totalDue" as const, label: "Total Due", icon: AlertCircle, format: formatCurrency },
];

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiConfig.map(({ key, label, icon: Icon, format }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                  <Icon className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold">{format(stats[key])}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.expenseTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deposit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.depositTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

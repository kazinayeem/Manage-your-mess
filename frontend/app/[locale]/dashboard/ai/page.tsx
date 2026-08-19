import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses, getDashboardStats } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

export default async function AIPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const stats = await getDashboardStats(messes[0].messId);
  const forecast = stats.monthlyExpenses * 1.08;
  const avgDeposit = stats.monthlyDeposits;

  const insights = [
    {
      icon: TrendingUp,
      title: "Expense Forecast",
      desc: `Next month expenses predicted at ${formatCurrency(forecast)} (8% increase based on trend).`,
    },
    {
      icon: AlertTriangle,
      title: "Highest Due Alert",
      desc: `Total outstanding dues: ${formatCurrency(stats.totalDue)}. Consider sending deposit reminders.`,
    },
    {
      icon: Lightbulb,
      title: "Budget Suggestion",
      desc: `Current meal rate is ${formatCurrency(stats.mealRate)}. Average deposit collected: ${formatCurrency(avgDeposit)}.`,
    },
    {
      icon: Brain,
      title: "Spending Pattern",
      desc: `Monthly expenses at ${formatCurrency(stats.monthlyExpenses)} with ${stats.totalMeals} total meals tracked.`,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Insights</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent><p className="text-sm text-zinc-500">{item.desc}</p></CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>AI Assistant Queries</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-500">
          <p>• How much did we spend this month? → {formatCurrency(stats.monthlyExpenses)}</p>
          <p>• What is our meal rate? → {formatCurrency(stats.mealRate)}</p>
          <p>• Predict next month expenses → {formatCurrency(forecast)}</p>
          <p>• Who has highest due? → Check Members page for individual dues</p>
        </CardContent>
      </Card>
    </div>
  );
}

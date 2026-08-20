import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function MealsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await apiGet("/messes");
  const messes = res?.data || res || [];
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const messId = messes[0].id || messes[0].messId;
  const messRes = await apiGet(`/messes/${messId}`);
  const mess = messRes?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meals</h1>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Current Meal Rate</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(mess?.mealRate ?? 0)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{mess?.totalMeals ?? 0}</p><p className="text-xs text-zinc-500">Total Meals</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{formatCurrency(mess?.totalExpenses ?? 0)}</p><p className="text-xs text-zinc-500">Total Expenses</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{formatCurrency(mess?.mealRate ?? 0)}</p><p className="text-xs text-zinc-500">Meal Rate</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Meal Calendar</CardTitle></CardHeader>
        <CardContent>
          <p className="text-center text-zinc-500 py-8">Manage meals using the active month tools.</p>
        </CardContent>
      </Card>
    </div>
  );
}

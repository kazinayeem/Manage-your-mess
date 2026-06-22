import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function MealsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const messId = messes[0].messId;
  const [mess, recentMeals] = await Promise.all([
    db.mess.findUnique({ where: { id: messId } }),
    db.meal.findMany({ where: { messId }, orderBy: { date: "desc" }, take: 30 }),
  ]);

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
          <div className="space-y-2">
            {recentMeals.map((meal) => (
              <div key={meal.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>{new Date(meal.date).toLocaleDateString()}</span>
                <div className="flex gap-4 text-zinc-500">
                  <span>B: {meal.breakfast}</span>
                  <span>L: {meal.lunch}</span>
                  <span>D: {meal.dinner}</span>
                </div>
              </div>
            ))}
            {recentMeals.length === 0 && <p className="text-center text-zinc-500 py-8">No meal entries yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

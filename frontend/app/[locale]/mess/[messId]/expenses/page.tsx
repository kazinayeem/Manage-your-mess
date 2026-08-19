import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { getMessExpenses } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MessMemberExpensesPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  await ensureCurrentMonth(ctx.messId);
  const expenses = await getMessExpenses(ctx.messId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mess Costs</h1>
      <p className="text-sm text-zinc-500">Read-only view of shared mess expenses.</p>
      <Card>
        <CardHeader>
          <CardTitle>Recent expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-zinc-500">No expenses yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {expenses.map((e) => (
                <li key={e.id} className="flex justify-between py-2">
                  <span>
                    {(e.description || e.category.name)} · {e.date.toLocaleDateString()}
                  </span>
                  <span>{formatCurrency(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

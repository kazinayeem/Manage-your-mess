import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses, getMessExpenses } from "@/lib/queries";
import { ExpensesTable } from "@/components/dashboard/expenses-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const expenses = await getMessExpenses(messes[0].messId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Expenses</h1>
      <ExpensesTable expenses={expenses} messId={messes[0].messId} />
      <Card>
        <CardHeader><CardTitle className="text-base">Add Expense</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">Use the mess detail page or API to add new expenses with receipt upload.</p>
        </CardContent>
      </Card>
    </div>
  );
}

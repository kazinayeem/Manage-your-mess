import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function BazaarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await apiGet("/bazaar/tasks");
  const tasks = res?.data || res || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bazaar Management</h1>
      <div className="space-y-4">
        {(Array.isArray(tasks) ? tasks : []).map((entry: any) => (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-base">{entry.title}</CardTitle>
                <span className="font-semibold text-emerald-600">{formatCurrency(entry.expectedBudget)}</span>
              </div>
              <p className="text-xs text-zinc-500">{formatDate(entry.shoppingDate)}</p>
            </CardHeader>
            {entry.notes && <CardContent><p className="text-sm text-zinc-500">{entry.notes}</p></CardContent>}
          </Card>
        ))}
        {(!Array.isArray(tasks) || tasks.length === 0) && (
          <Card><CardContent className="py-12 text-center text-zinc-500">No bazaar entries yet</CardContent></Card>
        )}
      </div>
    </div>
  );
}

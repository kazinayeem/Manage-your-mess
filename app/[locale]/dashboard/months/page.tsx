import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { getAllMonths } from "@/actions/monthly";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";

export default async function AllMonthsPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const months = await getAllMonths(ctx.messId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Months</h1>
      <div className="space-y-3">
        {months.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{m.label}</p>
                <p className="text-sm text-zinc-500">
                  Meals: {m.totalMeals} · Rate: {formatCurrency(m.mealRate)}
                </p>
                {m.closedAt && (
                  <p className="text-xs text-zinc-400">Closed {formatDate(m.closedAt)}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={m.status === "ACTIVE" ? "success" : "secondary"}>{m.status}</Badge>
                <Link
                  href={`/dashboard/months/${m.id}`}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  View
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {months.length === 0 && (
          <Card><CardContent className="py-12 text-center text-zinc-500">No months yet</CardContent></Card>
        )}
      </div>
    </div>
  );
}

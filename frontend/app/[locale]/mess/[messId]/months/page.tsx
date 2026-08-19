import { requireMessPage } from "@/lib/require-mess-page";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartNewMonthLink } from "@/components/mess/start-new-month-link";

export default async function MessMonthsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { requireWrite: true });

  const months = await db.messMonth.findMany({
    where: { messId: ctx.messId, deletedAt: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Months</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="text-base">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"}>{m.status}</Badge>
              <p>Meals: {m.totalMeals}</p>
              <p>Expenses: {m.totalExpenses}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {ctx.capabilities.canStartMonth && <StartNewMonthLink messId={messId} />}
    </div>
  );
}

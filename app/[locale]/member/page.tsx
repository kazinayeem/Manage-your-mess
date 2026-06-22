import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveMessContext, ensureCurrentMonth } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function MemberOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/welcome");

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const summary = await getMonthSummary(ctx.messId, month.id);
  if (!summary) redirect("/welcome");

  const myStats = summary.members.find((m) => m.id === ctx.member.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{ctx.mess.name}</h1>
          <Badge variant="secondary">Member</Badge>
        </div>
        <p className="text-zinc-500">{summary.month.label}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">My Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{myStats?.mealCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">My Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(myStats?.totalDeposit ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Meal Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(myStats?.mealCost ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">
              {formatCurrency(myStats?.due ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current month summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Meal rate: {formatCurrency(summary.mealRate)}</p>
          <p>Total mess expenses: {formatCurrency(summary.totalExpenses)}</p>
          <p>Your advance: {formatCurrency(myStats?.advance ?? 0)}</p>
          <p>Status: {ctx.member.status}</p>
        </CardContent>
      </Card>
    </div>
  );
}

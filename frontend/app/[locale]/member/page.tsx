import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveMessContext, ensureCurrentMonth } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function MemberOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/welcome");

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const res = await apiGet(`/reports/data?messId=${ctx.messId}&monthId=${month.id}`);
  const reportData = res?.data;
  if (!reportData) redirect("/welcome");

  const rows = reportData?.rows || [];
  const myStats = rows.find((m: any) => m.id === ctx.member.id || m.name === ctx.member.fullName);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{ctx.mess.name}</h1>
          <Badge variant="secondary">Member</Badge>
        </div>
        <p className="text-zinc-500">{month.label}</p>
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
            <p className="text-2xl font-bold">{formatCurrency(myStats?.deposit ?? 0)}</p>
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
              {formatCurrency(myStats?.status === "Due" ? Math.abs(myStats.balance || 0) : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current month summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Status: {ctx.member.status}</p>
        </CardContent>
      </Card>
    </div>
  );
}

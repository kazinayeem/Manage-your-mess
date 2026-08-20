import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveMessContext, ensureCurrentMonth } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MemberMealsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/welcome");

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const res = await apiGet(`/reports/data?messId=${ctx.messId}&monthId=${month.id}`);
  const reportData = res?.data;
  const rows = reportData?.rows || [];
  const myMember = rows.find((r: any) => r.id === ctx.member.id || r.name === ctx.member.fullName);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Meals</h1>
      <Card>
        <CardHeader>
          <CardTitle>{month.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600">
            Total Meals: {myMember?.mealCount ?? 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

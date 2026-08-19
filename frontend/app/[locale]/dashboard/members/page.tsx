import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { MembersTable } from "@/components/dashboard/members-table";

export default async function MembersPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const summary = ctx.currentMonth
    ? await getMonthSummary(ctx.messId, ctx.currentMonth.id)
    : null;

  const members =
    summary?.members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      role: m.role,
      status: m.status,
      totalMeals: m.mealCount,
      totalDue: m.due,
      totalDeposit: m.totalDeposit,
      user: { email: m.user.email },
    })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Members</h1>
      <MembersTable members={members} messId={ctx.messId} />
    </div>
  );
}

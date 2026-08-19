import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveMessContext, ensureCurrentMonth } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { MonthStats } from "@/components/mess/month-stats";
import { QuickActions } from "@/components/mess/quick-actions";
import { MemberCardGrid } from "@/components/mess/member-card";
import { InviteCard } from "@/components/mess/invite-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getActiveMessContext();

  if (!ctx) {
    return (
      <div className="space-y-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Welcome to MessFlow Pro</h1>
        <p className="text-zinc-500">
          Create your own mess (you become owner) or join an existing mess as a member.
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild><Link href="/welcome/create">Create Mess</Link></Button>
          <Button variant="outline" asChild><Link href="/welcome/join">Join Mess</Link></Button>
        </div>
      </div>
    );
  }

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const summary = await getMonthSummary(ctx.messId, month.id);
  if (!summary) redirect("/dashboard/messes/new");

  const roleLabel = ctx.isOwner
    ? "Owner"
    : ctx.member.role === "MESS_MANAGER"
      ? "Manager"
      : "Member";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{ctx.mess.name}</h1>
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
          <p className="text-zinc-500">
            {summary.month.label}
            {ctx.allMesses.length > 1 && ` · ${ctx.allMesses.length} messes on your account`}
          </p>
        </div>
        <QuickActions />
      </div>

      {ctx.canManageInvite && (
        <InviteCard
          messId={ctx.messId}
          messName={ctx.mess.name}
          inviteCode={ctx.mess.inviteCode}
        />
      )}

      <MonthStats
        stats={{
          monthLabel: summary.month.label,
          totalMembers: summary.memberCount,
          totalMeals: summary.totalMeals,
          totalExpenses: summary.totalExpenses,
          totalDeposits: summary.totalDeposits,
          mealRate: summary.mealRate,
          totalDue: summary.totalDue,
        }}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Members</h2>
        <MemberCardGrid
          members={summary.members.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            phone: m.phone,
            mealCount: m.mealCount,
            mealCost: m.mealCost,
            totalDeposit: m.totalDeposit,
            due: m.due,
            advance: m.advance,
            balance: m.balance,
          }))}
        />
      </div>
    </div>
  );
}

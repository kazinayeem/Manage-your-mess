import { notFound } from "next/navigation";
import { getMessContextById, ensureCurrentMonth } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { MessDashboardView } from "@/components/mess/mess-dashboard-view";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { getMessDisplayRoleLabel } from "@/lib/mess-role-label";
import { formatDate } from "@/lib/utils";

export default async function MessDashboardPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await getMessContextById(messId);
  if (!ctx) notFound();

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const summary = await getMonthSummary(ctx.messId, month.id);
  if (!summary) notFound();

  const [allJoined, notifications, currentMonthExpenses, currentMonthDeposits, currentMonthMeals, pendingBazaarCount] =
    await Promise.all([
      db.member.findMany({
        where: {
          messId: ctx.messId,
          deletedAt: null,
          status: { in: ["ACTIVE", "PENDING"] },
        },
        orderBy: { fullName: "asc" },
      }),
      db.notification.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.expense.findMany({
        where: { messId: ctx.messId, monthId: month.id, deletedAt: null, status: "APPROVED" },
        orderBy: { date: "asc" },
        select: { amount: true, date: true },
      }),
      db.deposit.findMany({
        where: { messId: ctx.messId, monthId: month.id, deletedAt: null, status: "APPROVED" },
        orderBy: { createdAt: "asc" },
        select: { amount: true, createdAt: true },
      }),
      db.meal.findMany({
        where: { messId: ctx.messId, monthId: month.id },
        orderBy: { date: "asc" },
        select: { date: true, breakfast: true, lunch: true, dinner: true, guestMeals: true },
      }),
      db.bazaarTask.count({
        where: {
          messId: ctx.messId,
          deletedAt: null,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "PENDING_REVIEW"] },
        },
      }),
    ]);

  const pendingMembers = allJoined.filter((m) => m.status === "PENDING");

  const memberRows = allJoined.map((m) => {
    const stats = summary.members.find((s) => s.id === m.id);
    return {
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      mealCount: stats?.mealCount ?? 0,
      totalDeposit: stats?.totalDeposit ?? 0,
      totalCost: stats?.totalCost ?? 0,
      balance: stats?.balance ?? 0,
      status: m.status,
    };
  });

  const isSameDay = (date: Date) => date.toDateString() === new Date().toDateString();
  const todayMeals = currentMonthMeals
    .filter((row) => isSameDay(row.date))
    .reduce((sum, row) => sum + row.breakfast + row.lunch + row.dinner + row.guestMeals, 0);
  const todayExpenses = currentMonthExpenses
    .filter((row) => isSameDay(row.date))
    .reduce((sum, row) => sum + row.amount, 0);
  const todayDeposits = currentMonthDeposits
    .filter((row) => isSameDay(row.createdAt))
    .reduce((sum, row) => sum + row.amount, 0);

  const [tRoles, tDash] = await Promise.all([
    getTranslations("roles"),
    getTranslations("messDashboard"),
  ]);
  const roleLabel = getMessDisplayRoleLabel(ctx.effectiveRole, tRoles, {
    isLegalOwner: ctx.isOwner && !ctx.isManager,
    isActiveManager: ctx.isManager,
  });

  return (
    <div className="space-y-6">
      <MessDashboardView
        messId={messId}
        userName={ctx.member.fullName ?? tDash("fallbackManager")}
        roleLabel={roleLabel}
        overview={{
          messName: ctx.mess.name,
          monthLabel: summary.month.label,
          currentBalance: summary.billKpis.messBalance,
          mealRate: summary.mealRate,
          totalDeposit: summary.totalDeposits,
          totalExpense: summary.totalExpenses,
          totalMembers: allJoined.length,
          totalDue: summary.billKpis.totalDue,
          planName: ctx.subscriptionAccess.plan?.name ?? ctx.mess.subscription?.plan?.name ?? ctx.planTier,
          daysRemaining: ctx.subscriptionAccess.daysRemaining,
        }}
        capabilities={ctx.capabilities}
        members={memberRows}
        notifications={notifications.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          createdAtLabel: formatDate(item.createdAt),
          isRead: item.isRead,
        }))}
        todaySummary={{
          meals: todayMeals,
          expenses: todayExpenses,
          deposits: todayDeposits,
          pendingBazaar: pendingBazaarCount,
          pendingMembers: pendingMembers.length,
        }}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { getMessContextById, ensureCurrentMonth } from "@/lib/mess-context";
import { getMonthSummary } from "@/actions/monthly";
import { MessDashboardView } from "@/components/mess/mess-dashboard-view";
import { db } from "@/lib/db";
import { PendingBazaarWidget } from "@/components/bazaar/pending-bazaar-widget";
import { getMyPendingBazaars } from "@/actions/bazaar";
import { getTranslations } from "next-intl/server";
import { getMessDisplayRoleLabel } from "@/lib/mess-role-label";
import { getBillCategoryLabel } from "@/lib/bills/categories";
import type { BillCategoryType } from "@prisma/client";
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

  const previousMonth = await db.messMonth.findFirst({
    where: {
      messId: ctx.messId,
      deletedAt: null,
      NOT: { id: month.id },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const [
    allJoined,
    pendingBazaars,
    notices,
    notifications,
    recentActivity,
    upcomingBills,
    pendingPayments,
    approvedBazaarTasks,
    recentBazaarTasks,
    currentMonthExpenses,
    currentMonthDeposits,
    currentMonthMeals,
    previousMonthBills,
  ] = await Promise.all([
    db.member.findMany({
      where: {
        messId: ctx.messId,
        deletedAt: null,
        status: { in: ["ACTIVE", "PENDING"] },
      },
      include: { user: { select: { email: true } } },
      orderBy: { fullName: "asc" },
    }),
    ctx.member ? getMyPendingBazaars(ctx.messId, ctx.member.id) : [],
    db.notice.findMany({
      where: {
        messId: ctx.messId,
        deletedAt: null,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    db.notification.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.auditLog.findMany({
      where: { messId: ctx.messId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.bill.findMany({
      where: {
        messId: ctx.messId,
        deletedAt: null,
        dueDate: { gte: new Date() },
        status: "PENDING",
      },
      orderBy: { dueDate: "asc" },
      take: 4,
    }),
    db.subscriptionPaymentRequest.findMany({
      where: { messId: ctx.messId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.bazaarTask.findMany({
      where: { messId: ctx.messId, deletedAt: null, status: "APPROVED" },
      include: {
        assignment: { include: { member: { select: { id: true, fullName: true } } } },
        submission: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.bazaarTask.findMany({
      where: {
        messId: ctx.messId,
        deletedAt: null,
        status: { in: ["ASSIGNED", "IN_PROGRESS", "PENDING_REVIEW", "APPROVED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
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
    previousMonth
      ? db.bill.findMany({
          where: { messId: ctx.messId, monthId: previousMonth.id, deletedAt: null },
          select: { category: true, amount: true },
        })
      : [],
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

  const byDay = <T,>(rows: T[], getDate: (row: T) => Date, getValue: (row: T) => number) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        getDate(row)
      );
      map.set(label, (map.get(label) ?? 0) + getValue(row));
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  };

  const previousBillsByCategory = previousMonthBills.reduce<Record<string, number>>((acc, bill) => {
    acc[bill.category] = (acc[bill.category] ?? 0) + bill.amount;
    return acc;
  }, {});

  const categoryAmount = (category: BillCategoryType) => summary.billsByCategory[category] ?? 0;
  const deltaForCategory = (category: BillCategoryType) => {
    const current = categoryAmount(category);
    const previous = previousBillsByCategory[category] ?? 0;
    if (!previous) return current ? 100 : null;
    return ((current - previous) / previous) * 100;
  };

  const topDepositor = [...summary.members].sort((a, b) => b.totalDeposit - a.totalDeposit)[0];
  const highestDue = [...summary.members].sort((a, b) => b.due - a.due)[0];
  const mostActive = [...summary.members].sort((a, b) => b.mealCount - a.mealCount)[0];

  const bazaarCompletedByMember = approvedBazaarTasks.reduce<Record<string, { name: string; count: number }>>(
    (acc, task) => {
      const member = task.assignment?.member;
      if (!member) return acc;
      acc[member.id] = acc[member.id] ?? { name: member.fullName ?? "Unknown", count: 0 };
      acc[member.id].count += 1;
      return acc;
    },
    {}
  );
  const mostBazaarCompleted = Object.values(bazaarCompletedByMember).sort((a, b) => b.count - a.count)[0];
  const bestContributor = [...summary.members].sort((a, b) => b.advance - a.advance)[0];

  const [tRoles, tDash] = await Promise.all([
    getTranslations("roles"),
    getTranslations("messDashboard"),
  ]);
  const roleLabel = getMessDisplayRoleLabel(ctx.effectiveRole, tRoles, {
    isLegalOwner: ctx.isOwner && !ctx.isManager,
    isActiveManager: ctx.isManager,
  });

  const totalBazaarCost = approvedBazaarTasks.reduce(
    (sum, task) => sum + (task.submission?.actualCost ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <PendingBazaarWidget messId={messId} tasks={pendingBazaars} />

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
          activeMembers: allJoined.filter((m) => m.status === "ACTIVE").length,
          totalDue: summary.billKpis.totalDue,
        }}
        capabilities={ctx.capabilities}
        quickInsights={[
          {
            label: tDash("insights.topDepositor"),
            value: topDepositor?.fullName ?? tDash("notAvailable"),
            helper: topDepositor
              ? `${topDepositor.totalDeposit.toLocaleString("en-US")} ${tDash("insights.deposited")}`
              : undefined,
          },
          {
            label: tDash("insights.highestDue"),
            value: highestDue?.fullName ?? tDash("notAvailable"),
            helper: highestDue
              ? `${highestDue.due.toLocaleString("en-US")} ${tDash("insights.due")}`
              : undefined,
          },
          {
            label: tDash("insights.mostActiveMember"),
            value: mostActive?.fullName ?? tDash("notAvailable"),
            helper: mostActive
              ? `${mostActive.mealCount.toFixed(2)} ${tDash("insights.meals")}`
              : undefined,
          },
          {
            label: tDash("insights.mostBazaarCompleted"),
            value: mostBazaarCompleted?.name ?? tDash("notAvailable"),
            helper: mostBazaarCompleted
              ? `${mostBazaarCompleted.count} ${tDash("insights.completed")}`
              : undefined,
          },
          {
            label: tDash("insights.bestContributor"),
            value: bestContributor?.fullName ?? tDash("notAvailable"),
            helper: bestContributor
              ? `${bestContributor.advance.toLocaleString("en-US")} ${tDash("insights.advance")}`
              : undefined,
          },
        ]}
        financialCards={[
          { key: "rent", label: tDash("rent"), amount: categoryAmount("HOUSE_RENT"), delta: deltaForCategory("HOUSE_RENT") },
          { key: "electricity", label: tDash("electricity"), amount: categoryAmount("ELECTRICITY"), delta: deltaForCategory("ELECTRICITY") },
          { key: "water", label: tDash("water"), amount: categoryAmount("WATER"), delta: deltaForCategory("WATER") },
          { key: "gas", label: tDash("gas"), amount: categoryAmount("GAS"), delta: deltaForCategory("GAS") },
          { key: "internet", label: tDash("internet"), amount: categoryAmount("INTERNET"), delta: deltaForCategory("INTERNET") },
        ]}
        chartData={{
          expenseTrend: byDay(currentMonthExpenses, (row) => row.date, (row) => row.amount),
          depositTrend: byDay(currentMonthDeposits, (row) => row.createdAt, (row) => row.amount),
          mealTrend: byDay(
            currentMonthMeals,
            (row) => row.date,
            (row) => row.breakfast + row.lunch + row.dinner + row.guestMeals
          ),
          dueTrend: [...summary.members]
            .filter((member) => member.due > 0)
            .sort((a, b) => b.due - a.due)
            .slice(0, 6)
            .map((member) => ({
              label: member.fullName?.split(" ")[0] ?? tDash("member"),
              value: member.due,
            })),
          utilityTrend: [
            { label: tDash("rent"), value: categoryAmount("HOUSE_RENT") },
            { label: tDash("electricity"), value: categoryAmount("ELECTRICITY") },
            { label: tDash("water"), value: categoryAmount("WATER") },
            { label: tDash("gas"), value: categoryAmount("GAS") },
            { label: tDash("internet"), value: categoryAmount("INTERNET") },
          ],
          bazaarTrend: approvedBazaarTasks.slice(0, 8).map((task) => ({
            label: formatDate(task.shoppingDate),
            value: task.submission?.actualCost ?? 0,
          })),
        }}
        bazaarInsights={{
          totalBazaarCost,
          pendingBazaar: recentBazaarTasks.filter((task) =>
            ["ASSIGNED", "IN_PROGRESS", "PENDING_REVIEW"].includes(task.status)
          ).length,
          completedBazaar: approvedBazaarTasks.length,
          assignedBazaar: pendingBazaars.length,
          recentActivity: recentBazaarTasks.map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status.replaceAll("_", " "),
            expectedBudget: task.expectedBudget,
          })),
        }}
        activities={recentActivity.map((item) => ({
          id: item.id,
          action: item.action.toLowerCase(),
          entity: item.entity,
          actor: item.user?.name ?? "System",
          createdAtLabel: formatDate(item.createdAt),
        }))}
        notices={notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          isPinned: notice.isPinned,
          scheduledAtLabel: notice.scheduledAt ? formatDate(notice.scheduledAt) : null,
        }))}
        members={memberRows}
        notifications={notifications.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          createdAtLabel: formatDate(item.createdAt),
          isRead: item.isRead,
        }))}
        pendingRequests={{
          members: pendingMembers.length,
          tasks: pendingBazaars.length,
          payments: pendingPayments.length,
        }}
        upcomingBills={upcomingBills.map((bill) => ({
          id: bill.id,
          label: getBillCategoryLabel(bill.category),
          amount: bill.amount,
          dueDateLabel: bill.dueDate ? formatDate(bill.dueDate) : summary.month.label,
        }))}
      />
    </div>
  );
}

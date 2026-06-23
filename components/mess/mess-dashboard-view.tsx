"use client";

import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardMembersTable, type DashboardMemberRow } from "@/components/mess/dashboard-members-table";
import { KpiGradientCard } from "@/components/mess/kpi-gradient-card";
import { formatCurrency } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import { bazaarTaskPath } from "@/lib/bazaar-routes";
import type { MessCapabilities } from "@/lib/mess-permissions";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  FileText,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Utensils,
  Wallet,
  Megaphone,
  Clock3,
  ArrowRight,
  CircleAlert,
} from "lucide-react";

const DashboardAnalyticsGrid = dynamic(
  () => import("@/components/mess/dashboard-analytics-grid").then((m) => m.DashboardAnalyticsGrid),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    ),
  }
);

type ChartPoint = { label: string; value: number };

type InsightPerson = {
  label: string;
  value: string;
  helper?: string;
};

type FinancialCard = {
  key: string;
  label: string;
  amount: number;
  delta: number | null;
};

type BazaarActivity = {
  id: string;
  title: string;
  status: string;
  expectedBudget: number;
};

type ActivityItem = {
  id: string;
  action: string;
  entity: string;
  actor: string;
  createdAtLabel: string;
};

type NoticeItem = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  scheduledAtLabel?: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAtLabel: string;
  isRead: boolean;
};

type UpcomingBill = {
  id: string;
  label: string;
  amount: number;
  dueDateLabel: string;
};

type MessDashboardViewProps = {
  messId: string;
  userName: string;
  roleLabel: string;
  overview: {
    messName: string;
    monthLabel: string;
    currentBalance: number;
    mealRate: number;
    totalDeposit: number;
    totalExpense: number;
    activeMembers: number;
    totalDue: number;
  };
  capabilities: MessCapabilities;
  quickInsights: InsightPerson[];
  financialCards: FinancialCard[];
  chartData: {
    expenseTrend: ChartPoint[];
    depositTrend: ChartPoint[];
    mealTrend: ChartPoint[];
    dueTrend: ChartPoint[];
    utilityTrend: ChartPoint[];
    bazaarTrend: ChartPoint[];
  };
  bazaarInsights: {
    totalBazaarCost: number;
    pendingBazaar: number;
    completedBazaar: number;
    assignedBazaar: number;
    recentActivity: BazaarActivity[];
  };
  activities: ActivityItem[];
  notices: NoticeItem[];
  members: DashboardMemberRow[];
  notifications: NotificationItem[];
  pendingRequests: { members: number; tasks: number; payments: number };
  upcomingBills: UpcomingBill[];
};

function ActionCard({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className="group flex h-full rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-zinc-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
              {label}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function deltaText(delta: number | null, t: (key: string) => string) {
  if (delta === null) return t("noPreviousData");
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function MessDashboardView({
  messId,
  userName,
  roleLabel,
  overview,
  capabilities,
  quickInsights,
  financialCards,
  chartData,
  bazaarInsights,
  activities,
  notices,
  members,
  notifications,
  pendingRequests,
  upcomingBills,
}: MessDashboardViewProps) {
  const t = useTranslations("messDashboard");
  const balanceTrend =
    overview.currentBalance >= 0 ? ("up" as const) : ("down" as const);

  const quickActions = [
    {
      href: messPath(messId, "/deposits/add"),
      label: t("actions.addDeposit.title"),
      description: t("actions.addDeposit.desc"),
      icon: Wallet,
      show: capabilities.canAddDeposits,
    },
    {
      href: messPath(messId, "/meals/add"),
      label: t("actions.addMeal.title"),
      description: t("actions.addMeal.desc"),
      icon: Utensils,
      show: capabilities.canAddMeals,
    },
    {
      href: messPath(messId, "/expenses/add"),
      label: t("actions.addExpense.title"),
      description: t("actions.addExpense.desc"),
      icon: Receipt,
      show: capabilities.canAddExpenses,
    },
    {
      href: messPath(messId, "/bazaar/new"),
      label: t("actions.createBazaar.title"),
      description: t("actions.createBazaar.desc"),
      icon: ShoppingCart,
      show: capabilities.canManageBazaar,
    },
    {
      href: messPath(messId, "/members/add"),
      label: t("actions.addMember.title"),
      description: t("actions.addMember.desc"),
      icon: UserPlus,
      show: capabilities.canManageMembers,
    },
    {
      href: messPath(messId, "/reports"),
      label: t("actions.generateReport.title"),
      description: t("actions.generateReport.desc"),
      icon: FileText,
      show: capabilities.canGenerateReports,
    },
  ].filter((item) => item.show);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-[20px] border border-zinc-200/80 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm dark:border-zinc-800 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-zinc-950 lg:grid-cols-[1.5fr_1fr] lg:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{roleLabel}</Badge>
            <Badge variant="outline">{overview.monthLabel}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("welcomeLabel")}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              {t("welcome", { name: userName })} 👋
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("currentMess")}:{" "}
              <span className="font-semibold text-zinc-900 dark:text-white">{overview.messName}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={messPath(messId, "/current-month")}>{t("viewMonthDetails")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={messPath(messId, "/reports")}>{t("openReports")}</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:self-start">
          <KpiGradientCard
            label={t("messBalance")}
            value={formatCurrency(overview.currentBalance)}
            icon={Wallet}
            tone="emerald"
            trend={balanceTrend}
            trendLabel={overview.currentBalance >= 0 ? t("positive") : t("negative")}
          />
          <KpiGradientCard
            label={t("mealRate")}
            value={formatCurrency(overview.mealRate)}
            icon={Utensils}
            tone="sky"
          />
          <KpiGradientCard
            label={t("totalDeposit")}
            value={formatCurrency(overview.totalDeposit)}
            icon={TrendingUp}
            tone="violet"
          />
          <KpiGradientCard
            label={t("totalExpenses")}
            value={formatCurrency(overview.totalExpense)}
            icon={Receipt}
            tone="amber"
          />
          <KpiGradientCard
            label={t("activeMembers")}
            value={String(overview.activeMembers)}
            icon={Users}
            tone="slate"
          />
          <KpiGradientCard
            label={t("totalDue")}
            value={formatCurrency(overview.totalDue)}
            icon={AlertCircle}
            tone="rose"
            trend={overview.totalDue > 0 ? "down" : "neutral"}
            trendLabel={overview.totalDue > 0 ? t("outstanding") : t("clear")}
          />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          {quickActions.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {t("quickActionsTitle")}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("quickActionsSubtitle")}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {quickActions.map((action) => (
                  <ActionCard key={action.href} {...action} />
                ))}
              </div>
            </section>
          )}

          <div className="min-w-0 w-full">
            <DashboardAnalyticsGrid {...chartData} />
          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {t("financialOverviewTitle")}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("financialOverviewSubtitle")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {financialCards.map((card) => (
                <Card key={card.key} className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {card.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white">
                      {formatCurrency(card.amount)}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      {card.delta !== null && card.delta >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                      )}
                      <span className="font-medium text-zinc-600 dark:text-zinc-300">
                        {deltaText(card.delta, t)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader>
                <CardTitle>{t("memberInsightsTitle")}</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("memberInsightsSubtitle")}
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {quickInsights.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.label}</p>
                    <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{item.value}</p>
                    {item.helper && (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.helper}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader>
                <CardTitle>{t("bazaarInsightsTitle")}</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("bazaarInsightsSubtitle")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                    <p className="text-xs text-zinc-500">{t("totalBazaarCost")}</p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatCurrency(bazaarInsights.totalBazaarCost)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                    <p className="text-xs text-zinc-500">{t("pendingBazaar")}</p>
                    <p className="mt-2 text-lg font-semibold">{bazaarInsights.pendingBazaar}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                    <p className="text-xs text-zinc-500">{t("completedBazaar")}</p>
                    <p className="mt-2 text-lg font-semibold">{bazaarInsights.completedBazaar}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                    <p className="text-xs text-zinc-500">{t("assignedBazaar")}</p>
                    <p className="mt-2 text-lg font-semibold">{bazaarInsights.assignedBazaar}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {t("recentBazaarActivity")}
                    </h3>
                    <Link
                      href={messPath(messId, "/bazaar/history")}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      {t("viewAll")}
                    </Link>
                  </div>
                  {bazaarInsights.recentActivity.length ? (
                    <div className="space-y-2">
                      {bazaarInsights.recentActivity.map((task) => (
                        <Link
                          key={task.id}
                          href={bazaarTaskPath(messId, task.id)}
                          className="flex items-center justify-between rounded-2xl border border-zinc-200/80 px-4 py-3 text-sm hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-zinc-800 dark:hover:bg-zinc-900"
                        >
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">{task.title}</p>
                            <p className="text-zinc-500 dark:text-zinc-400">{task.status}</p>
                          </div>
                          <span className="font-medium">{formatCurrency(task.expectedBudget)}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={ShoppingCart}
                      title={t("emptyBazaarTitle")}
                      description={t("emptyBazaarDescription")}
                      className="py-10"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader>
                <CardTitle>{t("recentActivityTitle")}</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("recentActivitySubtitle")}
                </p>
              </CardHeader>
              <CardContent>
                {activities.length ? (
                  <div className="space-y-4">
                    {activities.map((item) => (
                      <div key={item.id} className="relative pl-6">
                        <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div className="rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {item.actor}
                          </p>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            {item.action} {item.entity}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {item.createdAtLabel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Clock3}
                    title={t("emptyActivityTitle")}
                    description={t("emptyActivityDescription")}
                    className="py-10"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader>
                <CardTitle>{t("noticeWidgetTitle")}</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("noticeWidgetSubtitle")}
                </p>
              </CardHeader>
              <CardContent>
                {notices.length ? (
                  <div className="space-y-3">
                    {notices.map((notice) => (
                      <div
                        key={notice.id}
                        className="rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          {notice.isPinned && <Badge>{t("pinned")}</Badge>}
                          <p className="font-medium text-zinc-900 dark:text-white">{notice.title}</p>
                        </div>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          {notice.content}
                        </p>
                        {notice.scheduledAtLabel && (
                          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            {notice.scheduledAtLabel}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Megaphone}
                    title={t("emptyNoticeTitle")}
                    description={t("emptyNoticeDescription")}
                    className="py-10"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {t("memberTableTitle")}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("memberTableSubtitle")}
                </p>
              </div>
              <Badge variant="secondary">{t("totalMembers", { count: members.length })}</Badge>
            </div>
            <DashboardMembersTable messId={messId} members={members} />
          </section>
        </div>

        <aside className="hidden space-y-6 xl:block">
          <Card className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>{t("rightRailTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-medium">{t("recentNotifications")}</h3>
                </div>
                {notifications.length ? (
                  <div className="space-y-2">
                    {notifications.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {item.title}
                          </p>
                          {!item.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {item.message}
                        </p>
                        <p className="mt-2 text-[11px] text-zinc-400">{item.createdAtLabel}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">{t("noNotifications")}</p>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <CircleAlert className="h-4 w-4 text-amber-500" />
                  <h3 className="font-medium">{t("pendingRequestsTitle")}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{t("pendingMembers")}</span>
                    <span className="font-semibold">{pendingRequests.members}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{t("pendingBazaar")}</span>
                    <span className="font-semibold">{pendingRequests.tasks}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{t("pendingPayments")}</span>
                    <span className="font-semibold">{pendingRequests.payments}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-sky-500" />
                  <h3 className="font-medium">{t("upcomingBillsTitle")}</h3>
                </div>
                {upcomingBills.length ? (
                  <div className="space-y-2">
                    {upcomingBills.map((bill) => (
                      <div key={bill.id} className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{bill.label}</p>
                          <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">{formatCurrency(bill.amount)}</p>
                        <p className="mt-1 text-[11px] text-zinc-400">{bill.dueDateLabel}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">{t("noUpcomingBills")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

"use client";

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
import type { MessCapabilities } from "@/lib/mess-permissions";
import {
  AlertCircle,
  Bell,
  CreditCard,
  Receipt,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAtLabel: string;
  isRead: boolean;
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
    totalMembers: number;
    totalDue: number;
    planName: string;
    daysRemaining: number;
  };
  capabilities: MessCapabilities;
  members: DashboardMemberRow[];
  notifications: NotificationItem[];
  todaySummary: {
    meals: number;
    expenses: number;
    deposits: number;
    pendingBazaar: number;
    pendingMembers: number;
  };
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

export function MessDashboardView({
  messId,
  userName,
  roleLabel,
  overview,
  capabilities,
  members,
  notifications,
  todaySummary,
}: MessDashboardViewProps) {
  const t = useTranslations("messDashboard");
  const balanceTrend = overview.currentBalance >= 0 ? ("up" as const) : ("down" as const);

  const welcomeActions = [
    {
      href: messPath(messId, "/current-month"),
      label: t("viewMonthDetails"),
      show: true,
    },
    {
      href: messPath(messId, "/meals/add"),
      label: t("actions.addMeal.title"),
      show: capabilities.canAddMeals,
    },
    {
      href: messPath(messId, "/deposits/add"),
      label: t("actions.addDeposit.title"),
      show: capabilities.canAddDeposits,
    },
    {
      href: messPath(messId, "/expenses/add"),
      label: t("actions.addExpense.title"),
      show: capabilities.canAddExpenses,
    },
  ].filter((item) => item.show);

  const quickActions = [
    {
      href: messPath(messId, "/meals/add"),
      label: t("actions.addMeal.title"),
      description: t("actions.addMeal.desc"),
      icon: Utensils,
      show: capabilities.canAddMeals,
    },
    {
      href: messPath(messId, "/deposits/add"),
      label: t("actions.addDeposit.title"),
      description: t("actions.addDeposit.desc"),
      icon: Wallet,
      show: capabilities.canAddDeposits,
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
      href: messPath(messId, "/bills"),
      label: t("addBill"),
      description: t("addBillDescription"),
      icon: CreditCard,
      show: capabilities.canManageBills,
    },
    {
      href: messPath(messId, "/members/add"),
      label: t("actions.addMember.title"),
      description: t("actions.addMember.desc"),
      icon: UserPlus,
      show: capabilities.canManageMembers,
    },
  ].filter((item) => item.show);

  return (
    <div className="space-y-8">
      <section className="rounded-[20px] border border-zinc-200/80 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm dark:border-zinc-800 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-zinc-950 lg:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{roleLabel}</Badge>
          <Badge variant="outline">{overview.monthLabel}</Badge>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("welcomeLabel")}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
                {t("welcome", { name: userName })} 👋
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("currentMess")}</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{overview.messName}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("currentPlan")}</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{overview.planName}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("currentMonth")}</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{overview.monthLabel}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("daysRemaining")}</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-white">
                  {t("daysRemainingValue", { count: overview.daysRemaining })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {welcomeActions.map((action, index) => (
                <Button key={action.href} asChild variant={index === 0 ? "default" : "outline"}>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
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
            <KpiGradientCard label={t("mealRate")} value={formatCurrency(overview.mealRate)} icon={Utensils} tone="sky" />
            <KpiGradientCard label={t("totalDeposit")} value={formatCurrency(overview.totalDeposit)} icon={TrendingUp} tone="violet" />
            <KpiGradientCard label={t("totalExpenses")} value={formatCurrency(overview.totalExpense)} icon={Receipt} tone="amber" />
            <KpiGradientCard label={t("totalMembersLabel")} value={String(overview.totalMembers)} icon={Users} tone="slate" />
            <KpiGradientCard
              label={t("totalDue")}
              value={formatCurrency(overview.totalDue)}
              icon={AlertCircle}
              tone="rose"
              trend={overview.totalDue > 0 ? "down" : "neutral"}
              trendLabel={overview.totalDue > 0 ? t("outstanding") : t("clear")}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("todaySummaryTitle")}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("todaySummarySubtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: t("todayMeal"), value: todaySummary.meals.toFixed(2) },
            { label: t("todayExpense"), value: formatCurrency(todaySummary.expenses) },
            { label: t("todayDeposit"), value: formatCurrency(todaySummary.deposits) },
            { label: t("pendingBazaar"), value: String(todaySummary.pendingBazaar) },
            { label: t("pendingMembers"), value: String(todaySummary.pendingMembers) },
          ].map((item) => (
            <Card key={item.label} className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardContent className="p-5">
                <p className="text-sm text-zinc-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {quickActions.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("quickActionsTitle")}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("quickActionsSimpleSubtitle")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <ActionCard key={action.href} {...action} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("recentNotifications")}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("recentNotificationsSubtitle")}</p>
          </div>
          {capabilities.canViewAnalytics && (
            <Button variant="outline" asChild>
              <Link href={messPath(messId, "/reports/analytics")}>{t("viewAnalytics")}</Link>
            </Button>
          )}
        </div>

        {notifications.length ? (
          <div className="grid gap-3">
            {notifications.map((item) => (
              <Card key={item.id} className="rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                    <Bell className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-zinc-900 dark:text-white">{item.title}</p>
                      {!item.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.message}</p>
                    <p className="mt-2 text-xs text-zinc-400">{item.createdAtLabel}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title={t("recentNotifications")}
            description={t("noNotifications")}
            className="rounded-2xl border border-zinc-200/80 py-10 dark:border-zinc-800"
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("memberTableTitle")}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("memberTableSimpleSubtitle")}</p>
          </div>
          <Badge variant="secondary">{t("totalMembers", { count: members.length })}</Badge>
        </div>
        <DashboardMembersTable messId={messId} members={members} />
      </section>
    </div>
  );
}

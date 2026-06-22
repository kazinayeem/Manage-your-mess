"use client";

import type { ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import { MemberCardGrid, type MemberCardData } from "@/components/mess/member-card";
import { FileText, Utensils, Wallet, ShoppingCart, User } from "lucide-react";
import type { MessCapabilities } from "@/lib/mess-permissions";

export type MessOverviewData = {
  messName: string;
  monthLabel: string;
  monthStatus: string;
  messBalance: number;
  totalDeposit: number;
  totalMeals: number;
  totalMealCost: number;
  mealRate: number;
  totalRent: number;
  totalUtilities: number;
  sharedOtherCost: number;
};

export type MySummaryData = {
  mealCount: number;
  totalDeposit: number;
  myCost: number;
  myMealCost: number;
  myBillShare: number;
  balance: number;
};

type MessDashboardViewProps = {
  messId: string;
  overview: MessOverviewData;
  mySummary: MySummaryData;
  members: MemberCardData[];
  capabilities: MessCapabilities;
  showInvite?: boolean;
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2.5 text-sm last:border-0 dark:border-zinc-800">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function MyStatCard({
  value,
  label,
  icon: Icon,
  className,
}: {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  className: string;
}) {
  return (
    <Card className={`overflow-hidden border-0 text-white shadow-md ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-5 text-center">
        <Icon className="mb-2 h-8 w-8 opacity-90" />
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-sm font-medium opacity-90">{label}</p>
      </CardContent>
    </Card>
  );
}

export function MessDashboardView({
  messId,
  overview,
  mySummary,
  members,
  capabilities,
}: MessDashboardViewProps) {
  const t = useTranslations("messDashboard");
  const tWorkspace = useTranslations("workspace");

  const monthTitle = `${overview.messName}, ${overview.monthLabel}${
    overview.monthStatus === "ACTIVE" ? ` (${t("running")})` : ""
  }`;

  return (
    <div className="space-y-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h2 className="mb-4 text-base font-bold text-rose-600">{monthTitle}</h2>
            <StatRow label={t("messBalance")} value={formatCurrency(overview.messBalance)} />
            <StatRow label={t("totalDeposit")} value={formatCurrency(overview.totalDeposit)} />
            <StatRow label={t("totalMeal")} value={overview.totalMeals.toFixed(2)} />
            <StatRow label={t("totalMealCost")} value={formatCurrency(overview.totalMealCost)} />
            <StatRow label={t("mealRate")} value={formatCurrency(overview.mealRate)} />
            <StatRow label={t("totalRent")} value={formatCurrency(overview.totalRent)} />
            <StatRow label={t("totalUtilities")} value={formatCurrency(overview.totalUtilities)} />
            <StatRow
              label={t("totalSharedBills")}
              value={formatCurrency(overview.sharedOtherCost)}
            />
            <Link
              href={messPath(messId, "/current-month")}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-rose-600 hover:underline"
            >
              <FileText className="h-4 w-4" />
              {t("viewMonthDetails")}
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-rose-600">{t("mySummary")}</h2>
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <MyStatCard
              value={mySummary.mealCount.toFixed(2)}
              label={t("myMeal")}
              icon={Utensils}
              className="bg-sky-500"
            />
            <MyStatCard
              value={formatCurrency(mySummary.totalDeposit)}
              label={t("myDeposit")}
              icon={Wallet}
              className="bg-teal-500"
            />
            <MyStatCard
              value={formatCurrency(mySummary.myCost)}
              label={t("myCost")}
              icon={ShoppingCart}
              className="bg-pink-500"
            />
            <MyStatCard
              value={formatCurrency(mySummary.balance)}
              label={t("balance")}
              icon={User}
              className="bg-amber-400 text-amber-950"
            />
          </div>
          {capabilities.readOnly && (
            <p className="text-xs text-zinc-500">{tWorkspace("readOnlyHint")}</p>
          )}
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-rose-600">{t("allMembers")}</h2>
          <Badge variant="secondary">{t("totalMembers", { count: members.length })}</Badge>
        </div>
        <MemberCardGrid members={members} variant="dashboard" />
      </section>
    </div>
  );
}

"use client";

import type { BillShareBreakdown } from "@/lib/bills/categories";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { User } from "lucide-react";

export interface MemberCardData {
  id: string;
  fullName: string | null;
  phone: string | null;
  mealCount: number;
  mealCost: number;
  totalDeposit: number;
  due: number;
  advance: number;
  balance: number;
  sharedCostShare?: number;
  billShares?: BillShareBreakdown;
  totalCost?: number;
  status?: string;
}

export function MemberCard({
  member,
  variant = "default",
}: {
  member: MemberCardData;
  variant?: "default" | "dashboard";
}) {
  const t = useTranslations("memberCard");
  const hasDue = member.due > 0;
  const isPending = member.status === "PENDING";

  if (variant === "dashboard") {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{member.fullName ?? t("unnamed")}</p>
              {isPending && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {t("pendingApproval")}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-zinc-500">{t("totalMeal")}</p>
                <p className="font-semibold tabular-nums">{member.mealCount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500">{t("deposit")}</p>
                <p className="font-semibold tabular-nums">{formatCurrency(member.totalDeposit)}</p>
              </div>
            </div>
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-zinc-500">{t("mealCost")}</p>
                <p className="font-semibold tabular-nums">{formatCurrency(member.mealCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500">{t("billShare")}</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(member.sharedCostShare ?? member.billShares?.total ?? 0)}
                </p>
              </div>
            </div>
            {member.billShares && member.billShares.total > 0 && (
              <div className="grid grid-cols-2 gap-1 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
                {member.billShares.rent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t("rent")}</span>
                    <span className="tabular-nums">{formatCurrency(member.billShares.rent)}</span>
                  </div>
                )}
                {member.billShares.electricity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t("electricity")}</span>
                    <span className="tabular-nums">{formatCurrency(member.billShares.electricity)}</span>
                  </div>
                )}
                {member.billShares.water > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t("water")}</span>
                    <span className="tabular-nums">{formatCurrency(member.billShares.water)}</span>
                  </div>
                )}
                {member.billShares.internet > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t("internet")}</span>
                    <span className="tabular-nums">{formatCurrency(member.billShares.internet)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
              <div>
                <p className="text-zinc-500">{t("totalCost")}</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(member.totalCost ?? member.mealCost + (member.sharedCostShare ?? 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500">{member.due > 0 ? t("due") : t("balance")}</p>
                <p className={`font-semibold tabular-nums ${member.due > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(member.due > 0 ? member.due : member.advance)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={hasDue ? "border-red-200 dark:border-red-900" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{member.fullName ?? t("unnamed")}</p>
            {member.phone && <p className="text-xs text-zinc-500">{member.phone}</p>}
          </div>
          <Badge variant={hasDue ? "destructive" : "success"}>
            {hasDue ? t("due") : t("clear")}
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-zinc-500">{t("meals")}</p>
            <p className="font-medium">{member.mealCount}</p>
          </div>
          <div>
            <p className="text-zinc-500">{t("mealCost")}</p>
            <p className="font-medium">{formatCurrency(member.mealCost)}</p>
          </div>
          <div>
            <p className="text-zinc-500">{t("deposit")}</p>
            <p className="font-medium">{formatCurrency(member.totalDeposit)}</p>
          </div>
          <div>
            <p className="text-zinc-500">{hasDue ? t("due") : t("advance")}</p>
            <p className={`font-medium ${hasDue ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(hasDue ? member.due : member.advance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MemberCardGrid({
  members,
  variant = "default",
}: {
  members: MemberCardData[];
  variant?: "default" | "dashboard";
}) {
  const t = useTranslations("memberCard");

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-zinc-500">{t("emptyHint")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <MemberCard key={m.id} member={m} variant={variant} />
      ))}
    </div>
  );
}

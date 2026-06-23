"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";

export type DashboardMemberRow = {
  id: string;
  fullName: string | null;
  phone: string | null;
  mealCount: number;
  totalDeposit: number;
  totalCost: number;
  balance: number;
  status: string;
};

function initials(name: string | null) {
  return (name ?? "M")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardMembersTable({
  messId,
  members,
}: {
  messId: string;
  members: DashboardMemberRow[];
}) {
  const t = useTranslations("messDashboard");

  const columns: ColumnDef<DashboardMemberRow>[] = [
    {
      accessorKey: "fullName",
      header: t("member"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {initials(row.original.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900 dark:text-white">
              {row.original.fullName ?? t("unnamed")}
            </p>
            {row.original.phone && (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {row.original.phone}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "mealCount",
      header: t("meal"),
      cell: ({ row }) => row.original.mealCount.toFixed(2),
    },
    {
      accessorKey: "totalDeposit",
      header: t("deposit"),
      cell: ({ row }) => formatCurrency(row.original.totalDeposit),
    },
    {
      accessorKey: "totalCost",
      header: t("expense"),
      cell: ({ row }) => formatCurrency(row.original.totalCost),
    },
    {
      accessorKey: "balance",
      header: t("balance"),
      cell: ({ row }) => {
        const positive = row.original.balance >= 0;
        return (
          <span className={positive ? "text-emerald-600" : "text-rose-600"}>
            {formatCurrency(Math.abs(row.original.balance))}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "success" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: t("tableActions"),
      cell: ({ row }) => (
        <Button size="sm" variant="outline" asChild>
          <Link href={messPath(messId, `/members/${row.original.id}`)}>{t("view")}</Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={members}
      pageSize={8}
      exportFilename="members-dashboard"
      searchPlaceholder={t("searchMembers")}
      emptyTitle={t("memberTableEmptyTitle")}
      emptyDescription={t("memberTableEmptyDescription")}
    />
  );
}

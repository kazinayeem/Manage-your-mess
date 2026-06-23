"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import type { BazaarPriority, BazaarTaskStatus } from "@prisma/client";

export type BazaarTaskRow = {
  id: string;
  title: string;
  shoppingDate: Date;
  expectedBudget: number;
  priority: BazaarPriority;
  status: BazaarTaskStatus;
  assignment: {
    member: { fullName: string | null };
    expectedCompletionDate?: Date;
    assignedBy?: { name: string | null };
  } | null;
  submission?: { actualCost: number } | null;
  _count: { items: number };
};

const statusColors: Partial<Record<BazaarTaskStatus, string>> = {
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  PENDING_REVIEW: "bg-purple-100 text-purple-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CORRECTION_REQUESTED: "bg-orange-100 text-orange-800",
};

export function BazaarTaskList({ messId, tasks }: { messId: string; tasks: BazaarTaskRow[] }) {
  const t = useTranslations("bazaar");

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-zinc-500">{t("noTasks")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Link key={task.id} href={messPath(messId, `/bazaar/${task.id}`)}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{task.title}</h3>
                  <Badge variant="outline" className={statusColors[task.status]}>
                    {t(`status_${task.status}`)}
                  </Badge>
                  <Badge variant="secondary">{task.priority}</Badge>
                </div>
                <p className="text-sm text-zinc-500">
                  {task.assignment?.member.fullName ?? "—"} · {formatDate(task.shoppingDate)} ·{" "}
                  {task._count.items} {t("items")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-700">{formatCurrency(task.expectedBudget)}</p>
                {task.submission && (
                  <p className="text-xs text-zinc-500">
                    {t("actual")}: {formatCurrency(task.submission.actualCost)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

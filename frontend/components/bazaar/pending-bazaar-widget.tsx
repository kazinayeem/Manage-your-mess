import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import { bazaarTaskPath } from "@/lib/bazaar-routes";
import type { BazaarTaskStatus } from "@prisma/client";

type PendingTask = {
  id: string;
  title: string;
  shoppingDate: Date;
  expectedBudget: number;
  status: BazaarTaskStatus;
  assignment: {
    expectedCompletionDate: Date;
    assignedBy: { name: string | null };
  } | null;
  _count: { items: number };
};

export async function PendingBazaarWidget({
  messId,
  tasks,
}: {
  messId: string;
  tasks: PendingTask[];
}) {
  if (tasks.length === 0) return null;

  const t = await getTranslations("bazaar");
  const task = tasks[0];
  const dueToday =
    task.assignment &&
    new Date(task.assignment.expectedCompletionDate).toDateString() === new Date().toDateString();

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900 dark:from-emerald-950/40 dark:to-zinc-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
          {t("pendingTasks")}
          {tasks.length > 1 && (
            <Badge variant="secondary" className="ml-auto">
              +{tasks.length - 1}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold">{task.title}</p>
          <p className="text-sm text-zinc-500">
            {t("assignedBy")}: {task.assignment?.assignedBy.name ?? t("manager")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-zinc-500">{t("budget")}</p>
            <p className="font-medium">{formatCurrency(task.expectedBudget)}</p>
          </div>
          <div>
            <p className="text-zinc-500">{t("items")}</p>
            <p className="font-medium">{task._count.items}</p>
          </div>
          <div>
            <p className="text-zinc-500">{t("dueDate")}</p>
            <p className="font-medium">
              {dueToday ? t("today") : formatDate(task.assignment?.expectedCompletionDate ?? task.shoppingDate)}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">{t("status")}</p>
            <p className="font-medium">{t(`status_${task.status}`)}</p>
          </div>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={bazaarTaskPath(messId, task.id)}>{t("viewDetails")}</Link>
        </Button>
        {tasks.length > 1 && (
          <Link href={messPath(messId, "/bazaar/my")} className="block text-center text-sm text-emerald-600 hover:underline">
            {t("viewAllPending", { count: tasks.length })}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

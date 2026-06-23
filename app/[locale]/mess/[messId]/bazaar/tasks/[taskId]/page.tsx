import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { getBazaarTask } from "@/actions/bazaar";
import { SubmitBazaarForm } from "@/components/bazaar/submit-bazaar-form";
import { ReviewBazaarForm } from "@/components/bazaar/review-bazaar-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function BazaarTaskDetailPage({
  params,
}: {
  params: Promise<{ messId: string; taskId: string }>;
}) {
  const { messId, taskId } = await params;
  const ctx = await requireMessPage(messId);
  const task = await getBazaarTask(messId, taskId);
  if (!task) notFound();

  const isAssignee = ctx.member?.id === task.assignment?.memberId;
  const canManage = ctx.capabilities.canManageBazaar;
  const canSubmit =
    isAssignee && ["ASSIGNED", "IN_PROGRESS", "CORRECTION_REQUESTED"].includes(task.status);
  const canReview = canManage && task.status === "PENDING_REVIEW" && !!task.submission;

  if (!canManage && !isAssignee) notFound();

  const t = await getTranslations("bazaar");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <Badge>{t(`status_${task.status}`)}</Badge>
          <Badge variant="outline">{task.priority}</Badge>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {t("shoppingDate")}: {formatDate(task.shoppingDate)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("budget")}</p>
            <p className="text-lg font-semibold">{formatCurrency(task.expectedBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("assignedMember")}</p>
            <p className="text-lg font-semibold">{task.assignment?.member.fullName ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("manager")}</p>
            <p className="text-lg font-semibold">{task.assignment?.assignedBy.name ?? task.createdBy.name ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">{t("dueDate")}</p>
            <p className="text-lg font-semibold">
              {task.assignment ? formatDate(task.assignment.expectedCompletionDate) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {task.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("description")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">{task.description}</CardContent>
        </Card>
      )}

      {task.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">{task.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("shoppingItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y dark:divide-zinc-800">
            {task.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {item.name} — {item.quantity} {item.unit}
                </span>
                <span className="text-zinc-500">
                  {item.estimatedPrice != null ? formatCurrency(item.estimatedPrice) : "—"}
                  {item.status !== "PENDING" && (
                    <Badge variant="secondary" className="ml-2">
                      {t(`itemStatus_${item.status}`)}
                    </Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {task.submission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("submission")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              {t("actualCost")}: <strong>{formatCurrency(task.submission.actualCost)}</strong>
            </p>
            {task.submission.notes && <p>{task.submission.notes}</p>}
            {task.submission.missingItems && (
              <p className="text-red-600">
                {t("missingItems")}: {task.submission.missingItems}
              </p>
            )}
            {task.submission.receipts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {task.submission.receipts.map((r) => (
                  <a
                    key={r.id}
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block h-24 w-24 overflow-hidden rounded border"
                  >
                    {r.fileType?.includes("pdf") ? (
                      <span className="flex h-full items-center justify-center text-xs">PDF</span>
                    ) : (
                      <Image src={r.fileUrl} alt="" fill className="object-cover" unoptimized />
                    )}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canSubmit && (
        <SubmitBazaarForm
          messId={messId}
          taskId={taskId}
          items={task.items}
          expectedBudget={task.expectedBudget}
          canSubmit={canSubmit}
        />
      )}

      {canReview && task.submission && (
        <ReviewBazaarForm
          messId={messId}
          taskId={taskId}
          actualCost={task.submission.actualCost}
          expectedBudget={task.expectedBudget}
        />
      )}

      {task.status === "APPROVED" && task.expense && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardContent className="p-4 text-sm">
            {t("expenseCreated")}: {formatCurrency(task.expense.amount)}
            {task.rewardPoints > 0 && (
              <span className="ml-2 text-emerald-700">(+{task.rewardPoints} {t("points")})</span>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

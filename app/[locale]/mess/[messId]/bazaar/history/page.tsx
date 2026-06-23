import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { getBazaarHistory } from "@/actions/bazaar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BazaarHistoryPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canManageBazaar" });
  if (!ctx.capabilities.canManageBazaar) notFound();

  const t = await getTranslations("bazaar");
  const history = await getBazaarHistory(messId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("bazaarHistory")}</h1>
        <p className="text-sm text-zinc-500">{t("bazaarHistoryDesc")}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-zinc-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left">{t("date")}</th>
              <th className="px-4 py-3 text-left">{t("taskTitle")}</th>
              <th className="px-4 py-3 text-left">{t("memberName")}</th>
              <th className="px-4 py-3 text-right">{t("budget")}</th>
              <th className="px-4 py-3 text-right">{t("actual")}</th>
              <th className="px-4 py-3 text-right">{t("difference")}</th>
              <th className="px-4 py-3 text-left">{t("status")}</th>
              <th className="px-4 py-3 text-left">{t("approvedBy")}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => {
              const task = h.task;
              const budget = task.expectedBudget;
              const actual = task.submission?.actualCost ?? h.actualCost ?? 0;
              const diff = actual - budget;
              const approver = task.approvals[0]?.reviewedBy?.name;
              return (
                <tr key={h.id} className="border-t dark:border-zinc-800">
                  <td className="px-4 py-3">{formatDate(h.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3">{task.assignment?.member.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(budget)}</td>
                  <td className="px-4 py-3 text-right">{actual ? formatCurrency(actual) : "—"}</td>
                  <td className={`px-4 py-3 text-right ${diff > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {actual ? formatCurrency(diff) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{t(`status_${task.status}`)}</Badge>
                  </td>
                  <td className="px-4 py-3">{approver ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {history.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">{t("noHistory")}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

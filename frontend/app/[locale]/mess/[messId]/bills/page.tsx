import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { getMessBills } from "@/actions/bills";
import { getMonthSummary } from "@/actions/monthly";
import { BillsTable } from "@/components/mess/bills-table";
import { BillKpiCards } from "@/components/mess/bill-kpi-cards";
import { Button } from "@/components/ui/button";
import { messPath } from "@/lib/mess-routes";
import { PlusCircle, RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function MessBillsPage({
  params,
  searchParams,
}: {
  params: Promise<{ messId: string }>;
  searchParams: Promise<{ year?: string; category?: string }>;
}) {
  const { messId } = await params;
  const { year, category } = await searchParams;
  const ctx = await requireMessPage(messId);
  const t = await getTranslations("messBills");

  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const summary = await getMonthSummary(ctx.messId, month.id);
  if (!summary) notFound();

  const bills = await getMessBills(messId, {
    monthId: month.id,
    year: year ? parseInt(year, 10) : undefined,
    category: category as Parameters<typeof getMessBills>[1] extends { category?: infer C } ? C : never,
  });

  const readOnly = ctx.capabilities.readOnly;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-zinc-500">{month.label} · {t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!readOnly && ctx.capabilities.canManageBills && (
            <>
              <Button asChild>
                <Link href={messPath(messId, "/bills/add")}>
                  <PlusCircle className="h-4 w-4" />
                  {t("addBill")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={messPath(messId, "/bills/recurring")}>
                  <RefreshCw className="h-4 w-4" />
                  {t("recurring")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <BillKpiCards kpis={summary.billKpis} />

      <BillsTable messId={messId} bills={bills} readOnly={readOnly || !ctx.capabilities.canManageBills} />
    </div>
  );
}

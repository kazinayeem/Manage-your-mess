import { Link } from "@/i18n/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { BillsTable } from "@/components/mess/bills-table";
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
  const billsRes = await apiGet(`/bills?messId=${messId}&monthId=${month.id}${year ? `&year=${year}` : ""}${category ? `&category=${category}` : ""}`);

  const bills = billsRes?.data || billsRes || [];

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

      <BillsTable messId={messId} bills={Array.isArray(bills) ? bills : []} readOnly={readOnly || !ctx.capabilities.canManageBills} />
    </div>
  );
}

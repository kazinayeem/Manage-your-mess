import { notFound } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { getRecurringBills } from "@/actions/bills";
import { RecurringBillsClient } from "@/components/mess/recurring-bills-client";
import { getTranslations } from "next-intl/server";

export default async function RecurringBillsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  const t = await getTranslations("messBills");

  if (!ctx.capabilities.canManageBills) notFound();

  const recurring = await getRecurringBills(messId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("recurring")}</h1>
        <p className="text-sm text-zinc-500">{t("recurringSubtitle")}</p>
      </div>
      <RecurringBillsClient messId={messId} recurring={recurring} />
    </div>
  );
}

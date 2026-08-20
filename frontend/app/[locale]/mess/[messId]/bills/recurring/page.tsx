import { notFound } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { apiGet } from "@/lib/api-client";
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

  const res = await apiGet(`/bills/recurring?messId=${messId}`);
  const recurring = res?.data || res || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("recurring")}</h1>
        <p className="text-sm text-zinc-500">{t("recurringSubtitle")}</p>
      </div>
      <RecurringBillsClient messId={messId} recurring={Array.isArray(recurring) ? recurring : []} />
    </div>
  );
}

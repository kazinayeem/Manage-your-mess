import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { getBazaarAnalytics } from "@/actions/bazaar";
import { BazaarAnalytics } from "@/components/bazaar/bazaar-analytics";

export default async function BazaarReportsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canManageBazaar" });
  if (!ctx.capabilities.canManageBazaar) notFound();

  const t = await getTranslations("bazaar");
  const analytics = await getBazaarAnalytics(messId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("bazaarReports")}</h1>
        <p className="text-sm text-zinc-500">{t("bazaarReportsDesc")}</p>
      </div>
      <BazaarAnalytics data={analytics} />
    </div>
  );
}

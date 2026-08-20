import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { canViewBazaarAdmin } from "@/lib/bazaar-access";
import { apiGet } from "@/lib/api-client";
import { BazaarAnalytics } from "@/components/bazaar/bazaar-analytics";

export default async function BazaarReportsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  if (!canViewBazaarAdmin(ctx.capabilities, ctx.isOwner)) notFound();

  const t = await getTranslations("bazaar");
  const res = await apiGet(`/bazaar/analytics?messId=${messId}`);
  const analytics = res?.data || {
    totalSpent: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    averageCost: 0,
  };

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

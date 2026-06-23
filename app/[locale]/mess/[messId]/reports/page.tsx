import { auth } from "@/lib/auth";
import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { getMessMonthsForReports } from "@/actions/reports";
import { ReportsHub } from "@/components/mess/reports-hub";
import { getTranslations } from "next-intl/server";

export default async function MessReportsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canGenerateReports" });
  const t = await getTranslations("messReports");

  const session = await auth();
  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));
  const months = await getMessMonthsForReports(ctx.messId);
  const today = new Date().toISOString().split("T")[0];
  const planTier = ctx.mess.subscription?.plan.tier ?? "FREE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      </div>
      <ReportsHub
        messId={ctx.messId}
        months={months}
        defaultMonthId={month.id}
        defaultDate={today}
        planTier={planTier}
        generatedBy={session?.user?.name ?? session?.user?.email ?? undefined}
        capabilities={ctx.capabilities}
      />
    </div>
  );
}

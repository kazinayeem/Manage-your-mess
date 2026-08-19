import { notFound } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { MessAnalyticsView } from "@/components/analytics/mess-analytics-view";

export default async function MessReportsAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string; messId: string }>;
}) {
  const { locale, messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canViewAnalytics" });
  if (!ctx.capabilities.canViewAnalytics) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{locale === "bn" ? "রিপোর্ট অ্যানালিটিক্স" : "Reports Analytics"}</h1>
        <p className="text-zinc-500">{ctx.mess.name}</p>
      </div>
      <MessAnalyticsView messId={messId} locale={locale} />
    </div>
  );
}

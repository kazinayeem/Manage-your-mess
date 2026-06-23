import { SuperAdminAnalyticsView } from "@/components/analytics/super-admin-analytics-view";

export default async function SuperAdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Center</h1>
        <p className="text-zinc-500">Platform-wide insights, revenue, and growth metrics.</p>
      </div>
      <SuperAdminAnalyticsView locale={locale} />
    </div>
  );
}

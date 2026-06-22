import { getAdminStats } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function SuperAdminAnalyticsPage() {
  const stats = await getAdminStats();
  const items = [
    { label: "Total Users", value: String(stats.totalUsers) },
    { label: "Active Users (30d)", value: String(stats.activeUsers) },
    { label: "Total Messes", value: String(stats.totalMesses) },
    { label: "Active Members", value: String(stats.totalMembers) },
    { label: "Active Subscriptions", value: String(stats.activeSubscriptions) },
    { label: "Expired Subscriptions", value: String(stats.expiredSubscriptions) },
    { label: "Trial Accounts", value: String(stats.trialAccounts) },
    { label: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue) },
    { label: "Annual Revenue", value: formatCurrency(stats.annualRevenue) },
    { label: "Pending Payments", value: String(stats.pendingPayments) },
    { label: "Approved Payments", value: String(stats.approvedPayments) },
    { label: "Rejected Payments", value: String(stats.rejectedPayments) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-zinc-500">Platform growth and revenue metrics from live data.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

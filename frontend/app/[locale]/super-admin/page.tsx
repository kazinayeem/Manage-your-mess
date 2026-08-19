import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessSuperAdmin } from "@/lib/route-guard";
import { getAdminStats } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserCheck,
  Building2,
  GitBranch,
  UsersRound,
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  FlaskConical,
  Wallet,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default async function SuperAdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessSuperAdmin(session.user.role)) redirect("/dashboard");

  const stats = await getAdminStats();

  const kpis = [
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Active Users (30d)", value: stats.activeUsers, icon: UserCheck },
    { label: "Total Messes", value: stats.totalMesses, icon: Building2 },
    { label: "Total Branches", value: stats.totalBranches, icon: GitBranch },
    { label: "Total Members", value: stats.totalMembers, icon: UsersRound },
    { label: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue), icon: DollarSign },
    { label: "Annual Revenue", value: formatCurrency(stats.annualRevenue), icon: TrendingUp },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard },
    { label: "Expired Subscriptions", value: stats.expiredSubscriptions, icon: Clock },
    { label: "Trial Accounts", value: stats.trialAccounts, icon: FlaskConical },
    { label: "Pending Payments", value: stats.pendingPayments, icon: Wallet },
    { label: "Approved Payments", value: stats.approvedPayments, icon: CheckCircle },
    { label: "Rejected Payments", value: stats.rejectedPayments, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-zinc-500">
          SaaS platform overview — mess operations are managed separately at /dashboard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <Icon className="h-5 w-5 text-violet-600" />
                <p className="mt-3 text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-zinc-500">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>MRR: {formatCurrency(stats.mrr)}</p>
            <p>ARR: {formatCurrency(stats.arr)}</p>
            <p>Lifetime Revenue: {formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-violet-600">
            <p>→ Users, Messes, Subscriptions, Payments</p>
            <p>→ Plans, Coupons, Support, Audit Logs</p>
            <p>→ System Settings, Security Center</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

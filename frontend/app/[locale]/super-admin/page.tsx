"use client";

import { useGetSuperAdminOverviewQuery } from "@/lib/store/api/super-admin-api";
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

export default function SuperAdminDashboardPage() {
  const { data: res, isLoading, error } = useGetSuperAdminOverviewQuery();
  const stats = res?.data || res || {};

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading dashboard stats from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading dashboard overview</div>;
  }

  const kpis = [
    { label: "Total Users", value: stats.totalUsers ?? 0, icon: Users },
    { label: "Active Users (30d)", value: stats.activeUsers ?? 0, icon: UserCheck },
    { label: "Total Messes", value: stats.totalMesses ?? 0, icon: Building2 },
    { label: "Total Branches", value: stats.totalBranches ?? 0, icon: GitBranch },
    { label: "Total Members", value: stats.totalMembers ?? 0, icon: UsersRound },
    { label: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue ?? 0), icon: DollarSign },
    { label: "Annual Revenue", value: formatCurrency(stats.annualRevenue ?? 0), icon: TrendingUp },
    { label: "Active Subscriptions", value: stats.activeSubscriptions ?? 0, icon: CreditCard },
    { label: "Expired Subscriptions", value: stats.expiredSubscriptions ?? 0, icon: Clock },
    { label: "Trial Accounts", value: stats.trialAccounts ?? 0, icon: FlaskConical },
    { label: "Pending Payments", value: stats.pendingPayments ?? 0, icon: Wallet },
    { label: "Approved Payments", value: stats.approvedPayments ?? 0, icon: CheckCircle },
    { label: "Rejected Payments", value: stats.rejectedPayments ?? 0, icon: XCircle },
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
            <p>MRR: {formatCurrency(stats.monthlyRevenue ?? 0)}</p>
            <p>ARR: {formatCurrency(stats.annualRevenue ?? 0)}</p>
            <p>Lifetime Revenue: {formatCurrency(stats.totalRevenue ?? 0)}</p>
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

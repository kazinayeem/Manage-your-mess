import "server-only";
import { apiGet } from "@/lib/server-api";

export type UserMessesResult = any;
export type MessMembersResult = any;
export type MessExpensesResult = any;
export type MessDepositsResult = any;

export async function getDashboardStats(messId: string) {
  const res = await apiGet(`/analytics/dashboard?messId=${messId}`);
  if (res.success && res.data) {
    const data = res.data;
    return {
      totalMembers: data.totalMembers ?? 0,
      totalMeals: data.totalMeals ?? 0,
      monthlyExpenses: data.totalExpense ?? 0,
      monthlyDeposits: data.totalDeposit ?? 0,
      mealRate: data.mealRate ?? 0,
      totalDue: data.totalDues ?? 0,
      expenseTrend: data.recentExpenses || [],
      depositTrend: [],
    };
  }
  return {
    totalMembers: 0,
    totalMeals: 0,
    monthlyExpenses: 0,
    monthlyDeposits: 0,
    mealRate: 0,
    totalDue: 0,
    expenseTrend: [],
    depositTrend: [],
  };
}

export async function getUserMesses(userId: string): Promise<UserMessesResult[]> {
  const res = await apiGet(`/messes`);
  if (res.success && res.data) {
    return (res.data as any[]).map((mess) => ({
      id: mess.id,
      userId: mess.userId || userId,
      messId: mess.id,
      role: mess.role,
      status: mess.status,
      createdAt: new Date(mess.createdAt),
      updatedAt: new Date(mess.updatedAt),
      deletedAt: mess.deletedAt ? new Date(mess.deletedAt) : null,
      mess: {
        ...mess,
        id: mess.id,
        subscription: mess.subscription || null,
      },
    })) as UserMessesResult[];
  }
  return [];
}

export async function getMessMembers(messId: string): Promise<MessMembersResult[]> {
  const res = await apiGet(`/members?messId=${messId}`);
  if (res.success && res.data) {
    return res.data as MessMembersResult[];
  }
  return [];
}

export async function getMessExpenses(messId: string): Promise<MessExpensesResult[]> {
  const res = await apiGet(`/expenses?messId=${messId}`);
  if (res.success && res.data) {
    return res.data as MessExpensesResult[];
  }
  return [];
}

export async function getMessDeposits(messId: string): Promise<MessDepositsResult[]> {
  const res = await apiGet(`/deposits?messId=${messId}`);
  if (res.success && res.data) {
    return res.data as MessDepositsResult[];
  }
  return [];
}

export async function getAdminStats() {
  const res = await apiGet(`/super-admin/overview`);
  if (res.success && res.data) {
    const data = res.data;
    return {
      totalUsers: data.totalUsers ?? 0,
      activeUsers: data.activeUsers ?? data.totalUsers ?? 0,
      totalMesses: data.totalMesses ?? 0,
      totalBranches: data.totalBranches ?? 0,
      totalMembers: data.totalMembers ?? 0,
      monthlyRevenue: data.monthlyRevenue ?? 0,
      annualRevenue: data.annualRevenue ?? 0,
      activeSubscriptions: data.activeSubscriptions ?? 0,
      expiredSubscriptions: data.expiredSubscriptions ?? 0,
      trialAccounts: data.trialAccounts ?? 0,
      pendingPayments: data.pendingPayments ?? 0,
      approvedPayments: data.approvedPayments ?? 0,
      rejectedPayments: data.rejectedPayments ?? 0,
      totalRevenue: data.totalRevenue ?? data.monthlyRevenue ?? 0,
      mrr: data.monthlyRevenue ?? 0,
      arr: data.annualRevenue ?? 0,
      churnRate: 0,
      conversionRate: 0,
    };
  }
  return {
    totalUsers: 0,
    activeUsers: 0,
    totalMesses: 0,
    totalBranches: 0,
    totalMembers: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    trialAccounts: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    totalRevenue: 0,
    mrr: 0,
    arr: 0,
    churnRate: 0,
    conversionRate: 0,
  };
}

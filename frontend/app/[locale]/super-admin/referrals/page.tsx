"use client";

import { useGetAdminReferralsQuery } from "@/lib/store/api/super-admin-api";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SuperAdminReferralsPage() {
  const { data, isLoading, error } = useGetAdminReferralsQuery();
  const referrals = data?.data || data || [];

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading referrals from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading referrals</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-zinc-500">Track referral rewards and conversions.</p>
      </div>
      <div className="grid gap-2">
        {(!Array.isArray(referrals) || referrals.length === 0) && (
          <p className="text-sm text-zinc-500">No referrals yet.</p>
        )}
        {Array.isArray(referrals) && referrals.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="py-3 text-sm">
              <p>
                <strong>{r.referrer?.name ?? r.referrer?.email ?? 'User'}</strong> referred{" "}
                <strong>{r.referee?.name ?? r.referee?.email ?? 'User'}</strong>
              </p>
              <p className="text-zinc-500">
                Reward: {formatCurrency(r.rewardAmount || 0)} ·{" "}
                {r.isRewarded ? "Paid" : "Pending"} · {formatDate(r.createdAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

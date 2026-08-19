import { getAdminReferrals } from "@/actions/super-admin";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SuperAdminReferralsPage() {
  const referrals = await getAdminReferrals();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-zinc-500">Track referral rewards and conversions.</p>
      </div>
      <div className="grid gap-2">
        {referrals.length === 0 && <p className="text-sm text-zinc-500">No referrals yet.</p>}
        {referrals.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-3 text-sm">
              <p>
                <strong>{r.referrer.name ?? r.referrer.email}</strong> referred{" "}
                <strong>{r.referee.name ?? r.referee.email}</strong>
              </p>
              <p className="text-zinc-500">
                Reward: {formatCurrency(r.rewardAmount)} ·{" "}
                {r.isRewarded ? "Paid" : "Pending"} · {formatDate(r.createdAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

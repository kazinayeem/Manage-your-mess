import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminFeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feature Access</h1>
        <p className="text-zinc-500">
          Per-plan feature toggles are managed on each subscription plan. Edit a plan to enable or disable
          features for Free, Pro, Business, and Enterprise tiers.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage plan features</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/super-admin/plans" className="text-emerald-600 hover:underline">
            Go to Plans →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_FEATURE_LABELS } from "@/lib/billing/constants";
import {
  daysRemaining,
  formatPlanDuration,
  isSubscriptionActive,
  toParsedPlan,
} from "@/lib/billing/plan-utils";
import { formatCurrency } from "@/lib/utils";
import type { Subscription, Plan, Invoice, SubscriptionPaymentRequest } from "@prisma/client";

type SubWithRelations = Subscription & {
  plan: Plan;
  invoices: Invoice[];
  paymentRequests: SubscriptionPaymentRequest[];
};

export function SubscriptionDashboard({ subscription }: { subscription: SubWithRelations | null }) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-500">No active subscription. Choose a plan to get started.</p>
          <Button asChild><Link href="/pricing">View Plans</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const plan = toParsedPlan(subscription.plan);
  const active = isSubscriptionActive(subscription.status, subscription.currentPeriodEnd);
  const remaining = daysRemaining(subscription.currentPeriodEnd);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscription & Billing</h1>
          <p className="text-zinc-500">Manage your plan, billing history, and renewals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/pricing">Upgrade Plan</Link></Button>
          <Button asChild><Link href={`/pricing/subscribe/${plan.id}`}>Renew Plan</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-500">Current Plan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plan.name}</p>
            <p className="text-sm text-zinc-500">{formatCurrency(plan.price, plan.currency)} · {formatPlanDuration(plan)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-500">Expiry Date</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subscription.currentPeriodEnd.toLocaleDateString()}</p>
            <p className="text-sm text-zinc-500">{remaining} days remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-500">Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={active ? "default" : "destructive"} className="text-base">
              {subscription.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Feature Access</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {plan.features.map((f) => (
              <Badge key={f} variant="outline">
                {PLAN_FEATURE_LABELS[f] ?? f}
              </Badge>
            ))}
            {plan.features.length === 0 && <p className="text-sm text-zinc-500">Basic features only</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Billing History</CardTitle></CardHeader>
        <CardContent>
          {subscription.invoices.length === 0 && subscription.paymentRequests.length === 0 ? (
            <p className="text-sm text-zinc-500">No billing history yet.</p>
          ) : (
            <div className="space-y-3">
              {subscription.paymentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">Payment Request</p>
                    <p className="text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatCurrency(req.amount, req.currency)}</p>
                    <Badge variant="outline">{req.status}</Badge>
                  </div>
                </div>
              ))}
              {subscription.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">Invoice {inv.invoiceNumber}</p>
                    <p className="text-zinc-500">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatCurrency(inv.amount, inv.currency)}</p>
                    <Badge variant="outline">{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

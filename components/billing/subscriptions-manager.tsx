"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { extendSubscription, updateSubscriptionStatus } from "@/actions/billing";
import { EXTENSION_PRESETS } from "@/lib/billing/constants";
import { daysRemaining, formatPlanDuration, toParsedPlan } from "@/lib/billing/plan-utils";
import { formatCurrency } from "@/lib/utils";
import { CalendarPlus, Pause, Play } from "lucide-react";

type SubscriptionRow = Awaited<ReturnType<typeof import("@/actions/billing").getAllSubscriptions>>[number];

export function SubscriptionsManager({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extraDays, setExtraDays] = useState("30");
  const [customEnd, setCustomEnd] = useState("");
  const [reason, setReason] = useState("");

  function handleExtend(id: string) {
    startTransition(async () => {
      const result = await extendSubscription(
        id,
        Number(extraDays),
        reason || undefined,
        customEnd || undefined
      );
      if (result.success) {
        toast.success("Subscription extended");
        setExtendingId(null);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED") {
    startTransition(async () => {
      const result = await updateSubscriptionStatus(id, status, reason || undefined);
      if (result.success) {
        toast.success(`Status updated to ${status}`);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Management</h1>
        <p className="text-zinc-500">Extend, suspend, or manage user subscriptions and expiry dates.</p>
      </div>

      <div className="space-y-4">
        {subscriptions.map((sub) => {
          const parsed = toParsedPlan(sub.plan);
          const remaining = daysRemaining(sub.currentPeriodEnd);
          return (
            <Card key={sub.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{sub.user.name ?? sub.user.email}</CardTitle>
                  <p className="text-sm text-zinc-500">{sub.user.email}</p>
                </div>
                <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>{sub.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className="text-zinc-500">Plan:</span> {sub.plan.name}</div>
                  <div><span className="text-zinc-500">Price:</span> {formatCurrency(sub.plan.price, sub.plan.currency)}</div>
                  <div><span className="text-zinc-500">Duration:</span> {formatPlanDuration(parsed)}</div>
                  <div><span className="text-zinc-500">Expires:</span> {sub.currentPeriodEnd.toLocaleDateString()}</div>
                  <div><span className="text-zinc-500">Days left:</span> {remaining}</div>
                  <div><span className="text-zinc-500">Messes:</span> {sub.messes.map((m) => m.name).join(", ") || "—"}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setExtendingId(extendingId === sub.id ? null : sub.id)}>
                    <CalendarPlus className="h-4 w-4" /> Extend
                  </Button>
                  {sub.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" className="gap-1" disabled={pending} onClick={() => handleStatus(sub.id, "SUSPENDED")}>
                      <Pause className="h-4 w-4" /> Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" disabled={pending} onClick={() => handleStatus(sub.id, "ACTIVE")}>
                      <Play className="h-4 w-4" /> Activate
                    </Button>
                  )}
                </div>

                {extendingId === sub.id && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {EXTENSION_PRESETS.map((p) => (
                        <Button key={p.label} type="button" size="sm" variant="outline" onClick={() => { setExtraDays(String(p.days)); setCustomEnd(""); }}>
                          {p.label}
                        </Button>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label>Additional Days</Label>
                        <Input type="number" value={extraDays} onChange={(e) => setExtraDays(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Or Custom End Date</Label>
                        <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                      </div>
                      <div className="space-y-1 sm:col-span-3">
                        <Label>Reason</Label>
                        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                      </div>
                    </div>
                    <Button size="sm" disabled={pending} onClick={() => handleExtend(sub.id)}>Save Extension</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

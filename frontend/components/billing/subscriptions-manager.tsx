"use client";

import { useState } from "react";
import { useGetAdminSubscriptionsQuery, useGetAdminPlansQuery } from "@/lib/store/api/super-admin-api";
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
import { assignSubscriptionPlan, extendSubscription, updateSubscriptionStatus } from "@/actions/billing";
import { EXTENSION_PRESETS } from "@/lib/billing/constants";
import { daysRemaining, formatPlanDuration, toParsedPlan } from "@/lib/billing/plan-utils";
import { formatCurrency } from "@/lib/utils";
import { CalendarPlus, Pause, Play } from "lucide-react";

export function SubscriptionsManager() {
  const { data: subData, isLoading: subLoading, error: subError } = useGetAdminSubscriptionsQuery();
  const { data: planData, isLoading: planLoading } = useGetAdminPlansQuery();

  const subscriptions = subData?.data || subData || [];
  const plans = planData?.data || planData || [];

  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [extraDays, setExtraDays] = useState("30");
  const [customEnd, setCustomEnd] = useState("");
  const [reason, setReason] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [bonusDays, setBonusDays] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleExtend(id: string) {
    setIsSubmitting(true);
    const result = await extendSubscription(
      id,
      Number(extraDays),
      reason || undefined,
      customEnd || undefined
    );
    if (result.success) {
      toast.success("Subscription extended");
      setExtendingId(null);
    } else toast.error(result.error);
    setIsSubmitting(false);
  }

  async function handleStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED") {
    setIsSubmitting(true);
    const result = await updateSubscriptionStatus(id, status, reason || undefined);
    if (result.success) {
      toast.success(`Status updated to ${status}`);
    } else toast.error(result.error);
    setIsSubmitting(false);
  }

  async function handleAssign(subscription: any) {
    setIsSubmitting(true);
    const result = await assignSubscriptionPlan({
      userId: subscription.user.id,
      planId: selectedPlanId || (plans[0]?.id ?? ""),
      messId: subscription.messes?.[0]?.id ?? null,
      customExpiryDate: customEnd || undefined,
      bonusDays: Number(bonusDays || 0),
    });
    if (result.success) {
      toast.success("Plan assigned");
      setAssigningId(null);
    } else toast.error(result.error);
    setIsSubmitting(false);
  }

  if (subLoading || planLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading subscriptions from Express API...</div>;
  }

  if (subError) {
    return <div className="p-4 text-sm text-red-500">Error loading subscriptions</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Management</h1>
        <p className="text-zinc-500">Extend, suspend, or manage user subscriptions and expiry dates.</p>
      </div>

      <div className="space-y-4">
        {Array.isArray(subscriptions) && subscriptions.map((sub: any) => {
          if (!sub.plan) return null;
          const parsed = toParsedPlan(sub.plan as never);
          const endDate = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date();
          const remaining = daysRemaining(endDate);
          return (
            <Card key={sub.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{sub.user?.name ?? sub.user?.email ?? "User"}</CardTitle>
                  <p className="text-sm text-zinc-500">{sub.user?.email}</p>
                </div>
                <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>{sub.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className="text-zinc-500">Plan:</span> {sub.plan.name}</div>
                  <div><span className="text-zinc-500">Price:</span> {formatCurrency(sub.plan.price ?? 0, sub.plan.currency ?? "BDT")}</div>
                  <div><span className="text-zinc-500">Duration:</span> {formatPlanDuration(parsed)}</div>
                  <div><span className="text-zinc-500">Expires:</span> {endDate.toLocaleDateString()}</div>
                  <div><span className="text-zinc-500">Days left:</span> {remaining}</div>
                  <div><span className="text-zinc-500">Messes:</span> {sub.messes?.map((m: any) => m.name).join(", ") || "—"}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setExtendingId(extendingId === sub.id ? null : sub.id)}>
                    <CalendarPlus className="h-4 w-4" /> Extend
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAssigningId(assigningId === sub.id ? null : sub.id)}>
                    Assign Plan
                  </Button>
                  {sub.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" className="gap-1" disabled={isSubmitting} onClick={() => handleStatus(sub.id, "SUSPENDED")}>
                      <Pause className="h-4 w-4" /> Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" disabled={isSubmitting} onClick={() => handleStatus(sub.id, "ACTIVE")}>
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
                    <Button size="sm" disabled={isSubmitting} onClick={() => handleExtend(sub.id)}>Save Extension</Button>
                  </div>
                )}

                {assigningId === sub.id && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label>Plan</Label>
                        <Select value={selectedPlanId || plans[0]?.id || ""} onValueChange={setSelectedPlanId}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.isArray(plans) && plans.map((plan: any) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Bonus Days</Label>
                        <Input type="number" value={bonusDays} onChange={(e) => setBonusDays(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Custom Expiry (optional)</Label>
                        <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                      </div>
                    </div>
                    <Button size="sm" disabled={isSubmitting} onClick={() => handleAssign(sub)}>
                      Save Assignment
                    </Button>
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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { savePlan, deletePlan } from "@/actions/billing";
import {
  PLAN_FEATURES,
  PLAN_FEATURE_LABELS,
  PLAN_LIMIT_KEYS,
  PLAN_LIMIT_LABELS,
  DURATION_PRESETS,
} from "@/lib/billing/constants";
import type { Plan } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatPlanDuration, parsePlanFeatures, parsePlanLimits } from "@/lib/billing/plan-utils";
import { toParsedPlan } from "@/lib/billing/plan-utils";
import { formatCurrency } from "@/lib/utils";

type PlanWithCount = Plan & { _count: { subscriptions: number } };

export function PlansManager({ plans }: { plans: PlanWithCount[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "0",
    currency: "BDT",
    durationType: "MONTHS",
    durationValue: "1",
    customExpiryDate: "",
    maxMembers: "10",
    isActive: true,
    isDefault: false,
    isPopular: false,
    sortOrder: "0",
    features: [] as string[],
    limits: {} as Record<string, string>,
  });

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "0",
      currency: "BDT",
      durationType: "MONTHS",
      durationValue: "1",
      customExpiryDate: "",
      maxMembers: "10",
      isActive: true,
      isDefault: false,
      isPopular: false,
      sortOrder: String(plans.length),
      features: [PLAN_FEATURES.MEAL_TRACKING, PLAN_FEATURES.EXPENSE_TRACKING],
      limits: {},
    });
    setShowForm(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    const features = parsePlanFeatures(plan.features);
    const limits = parsePlanLimits(plan.limits);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      price: String(plan.price),
      currency: plan.currency,
      durationType: plan.durationType,
      durationValue: String(plan.durationValue),
      customExpiryDate: plan.customExpiryDate
        ? plan.customExpiryDate.toISOString().slice(0, 10)
        : "",
      maxMembers: String(plan.maxMembers),
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      isPopular: plan.isPopular,
      sortOrder: String(plan.sortOrder),
      features,
      limits: Object.fromEntries(
        Object.entries(limits).map(([k, v]) => [k, String(v)])
      ),
    });
    setShowForm(true);
  }

  function toggleFeature(key: string) {
    setForm((f) => ({
      ...f,
      features: f.features.includes(key)
        ? f.features.filter((x) => x !== key)
        : [...f.features, key],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    fd.set("name", form.name);
    fd.set("description", form.description);
    fd.set("price", form.price);
    fd.set("currency", form.currency);
    fd.set("durationType", form.durationType);
    fd.set("durationValue", form.durationValue);
    if (form.durationType === "CUSTOM_DATE") fd.set("customExpiryDate", form.customExpiryDate);
    fd.set("maxMembers", form.maxMembers);
    fd.set("isActive", String(form.isActive));
    fd.set("isDefault", String(form.isDefault));
    fd.set("isPopular", String(form.isPopular));
    fd.set("sortOrder", form.sortOrder);
    form.features.forEach((f) => fd.append("features", f));
    const limits: Record<string, number> = {};
    for (const key of PLAN_LIMIT_KEYS) {
      const val = form.limits[key];
      if (val !== undefined && val !== "") limits[key] = Number(val);
    }
    limits.members = Number(form.maxMembers);
    fd.set("limits", JSON.stringify(limits));

    startTransition(async () => {
      const result = await savePlan(fd);
      if (result.success) {
        toast.success(editing ? "Plan updated" : "Plan created");
        setShowForm(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Deactivate or delete this plan?")) return;
    startTransition(async () => {
      const result = await deletePlan(id);
      if (result.success) {
        toast.success("Plan removed");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan Management</h1>
          <p className="text-zinc-500">Create unlimited plans with custom pricing, duration, limits, and features.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Plan" : "New Plan"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Members Limit</Label>
                  <Input type="number" value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: e.target.value })} />
                  <p className="text-xs text-zinc-500">Use -1 for unlimited</p>
                </div>
                <div className="space-y-2">
                  <Label>Duration Type</Label>
                  <Select value={form.durationType} onValueChange={(v) => setForm({ ...form, durationType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAYS">Days</SelectItem>
                      <SelectItem value="WEEKS">Weeks</SelectItem>
                      <SelectItem value="MONTHS">Months</SelectItem>
                      <SelectItem value="YEARS">Years</SelectItem>
                      <SelectItem value="CUSTOM_DATE">Custom Expiry Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration Value</Label>
                  <Input type="number" min="1" value={form.durationValue} onChange={(e) => setForm({ ...form, durationValue: e.target.value })} disabled={form.durationType === "CUSTOM_DATE"} />
                </div>
                {form.durationType === "CUSTOM_DATE" && (
                  <div className="space-y-2">
                    <Label>Custom Expiry Date</Label>
                    <Input type="date" value={form.customExpiryDate} onChange={(e) => setForm({ ...form, customExpiryDate: e.target.value })} />
                  </div>
                )}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Quick Duration Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm({ ...form, durationType: p.type, durationValue: String(p.value) })
                      }
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Plan Limits</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {PLAN_LIMIT_KEYS.filter((k) => k !== "members").map((key) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{PLAN_LIMIT_LABELS[key]}</Label>
                      <Input
                        type="number"
                        placeholder="-1 = unlimited"
                        value={form.limits[key] ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, limits: { ...form.limits, [key]: e.target.value } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Feature Toggles</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(PLAN_FEATURE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                      <Switch checked={form.features.includes(key)} onCheckedChange={() => toggleFeature(key)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} />
                  Default (free) plan
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.isPopular} onCheckedChange={(v) => setForm({ ...form, isPopular: v })} />
                  Mark as Popular
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>{editing ? "Save Changes" : "Create Plan"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const parsed = toParsedPlan(plan);
          return (
            <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {plan.isPopular && <Badge>Popular</Badge>}
                    {plan.isDefault && <Badge variant="secondary">Default</Badge>}
                  </CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">{formatPlanDuration(parsed)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-2xl font-bold">
                  {plan.price === 0 && plan.slug === "enterprise"
                    ? "Custom"
                    : formatCurrency(plan.price, plan.currency)}
                </p>
                <p className="text-zinc-500">
                  {plan.maxMembers === -1 ? "Unlimited members" : `Up to ${plan.maxMembers} members`}
                </p>
                <p className="text-zinc-500">{plan._count.subscriptions} active subscriptions</p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {parsePlanFeatures(plan.features).slice(0, 4).map((f) => (
                    <Badge key={f} variant="outline" className="text-xs">
                      {PLAN_FEATURE_LABELS[f as keyof typeof PLAN_FEATURE_LABELS] ?? f}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

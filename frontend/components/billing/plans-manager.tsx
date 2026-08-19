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
import {
  deletePlan,
  duplicatePlan,
  saveBillingSettings,
  savePlan,
  updatePlanLifecycle,
} from "@/actions/billing";
import {
  DURATION_PRESETS,
  PLAN_FEATURES,
  type PlanFeatureKey,
  PLAN_FEATURE_LABELS,
  PLAN_LIMIT_KEYS,
  PLAN_LIMIT_LABELS,
  TRIAL_DURATION_PRESETS,
} from "@/lib/billing/constants";
import type { BillingSetting, Plan, PlanDurationType, PlanVisibility } from "@prisma/client";
import { Archive, Copy, Eye, EyeOff, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { formatPlanDuration, parsePlanFeatures, parsePlanLimits, toParsedPlan } from "@/lib/billing/plan-utils";
import { formatCurrency } from "@/lib/utils";

type PlanWithCount = Plan & { _count: { subscriptions: number } };
type BillingSettingsWithPlan = BillingSetting & {
  defaultTrialPlan: Plan | null;
};

type PlanForm = {
  name: string;
  description: string;
  badge: string;
  color: string;
  price: string;
  currency: string;
  durationType: PlanDurationType;
  durationValue: string;
  customExpiryDate: string;
  maxMembers: string;
  visibility: PlanVisibility;
  isActive: boolean;
  isDefault: boolean;
  isPopular: boolean;
  isTrialPlan: boolean;
  isArchived: boolean;
  sortOrder: string;
  features: PlanFeatureKey[];
  limits: Record<string, string>;
};

type TrialForm = {
  trialDurationType: PlanDurationType;
  trialDurationValue: string;
  trialCustomEndDate: string;
  defaultTrialPlanId: string;
  allowTrialOnCreate: boolean;
};

const EMPTY_FORM: PlanForm = {
  name: "",
  description: "",
  badge: "",
  color: "#10b981",
  price: "0",
  currency: "BDT",
  durationType: "MONTHS",
  durationValue: "1",
  customExpiryDate: "",
  maxMembers: "10",
  visibility: "PUBLIC",
  isActive: true,
  isDefault: false,
  isPopular: false,
  isTrialPlan: false,
  isArchived: false,
  sortOrder: "0",
  features: [PLAN_FEATURES.MEAL_MANAGEMENT, PLAN_FEATURES.DEPOSIT_MANAGEMENT, PLAN_FEATURES.EXPENSE_MANAGEMENT],
  limits: {} as Record<string, string>,
};

export function PlansManager({
  plans,
  settings,
}: {
  plans: PlanWithCount[];
  settings: BillingSettingsWithPlan;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [trialForm, setTrialForm] = useState<TrialForm>({
    trialDurationType: settings.trialDurationType,
    trialDurationValue: String(settings.trialDurationValue),
    trialCustomEndDate: settings.trialCustomEndDate ? settings.trialCustomEndDate.toISOString().slice(0, 10) : "",
    defaultTrialPlanId: settings.defaultTrialPlanId ?? "none",
    allowTrialOnCreate: settings.allowTrialOnCreate,
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: String(plans.length) });
    setShowForm(true);
  }

  function openEdit(plan: Plan) {
    const features = parsePlanFeatures(plan.features) as PlanFeatureKey[];
    const limits = parsePlanLimits(plan.limits);
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      badge: plan.badge ?? "",
      color: plan.color ?? "#10b981",
      price: String(plan.price),
      currency: plan.currency,
      durationType: plan.durationType,
      durationValue: String(plan.durationValue),
      customExpiryDate: plan.customExpiryDate ? plan.customExpiryDate.toISOString().slice(0, 10) : "",
      maxMembers: String(plan.maxMembers),
      visibility: plan.visibility,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      isPopular: plan.isPopular,
      isTrialPlan: plan.isTrialPlan,
      isArchived: plan.isArchived,
      sortOrder: String(plan.sortOrder),
      features,
      limits: Object.fromEntries(Object.entries(limits).map(([key, value]) => [key, String(value)])),
    });
    setShowForm(true);
  }

  function toggleFeature(key: PlanFeatureKey) {
    setForm((current) => ({
      ...current,
      features: current.features.includes(key)
        ? current.features.filter((entry) => entry !== key)
        : [...current.features, key],
    }));
  }

  function submitPlan(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    Object.entries(form).forEach(([key, value]) => {
      if (key === "features" || key === "limits") return;
      fd.set(key, String(value));
    });
    form.features.forEach((feature) => fd.append("features", feature));

    const limits: Record<string, number> = {};
    for (const key of PLAN_LIMIT_KEYS) {
      const value = form.limits[key];
      if (value !== undefined && value !== "") limits[key] = Number(value);
    }
    limits.members = Number(form.maxMembers);
    fd.set("limits", JSON.stringify(limits));

    startTransition(async () => {
      const result = await savePlan(fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Plan updated" : "Plan created");
      setShowForm(false);
      router.refresh();
    });
  }

  function handleLifecycle(planId: string, action: "enable" | "disable" | "hide" | "show" | "archive") {
    startTransition(async () => {
      const result = await updatePlanLifecycle(planId, action);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan updated");
      router.refresh();
    });
  }

  function handleDuplicate(planId: string) {
    startTransition(async () => {
      const result = await duplicatePlan(planId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan duplicated");
      router.refresh();
    });
  }

  function handleDelete(planId: string) {
    if (!confirm("Delete or archive this plan?")) return;
    startTransition(async () => {
      const result = await deletePlan(planId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan removed");
      router.refresh();
    });
  }

  function submitTrialSettings(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("trialDurationType", trialForm.trialDurationType);
    fd.set("trialDurationValue", trialForm.trialDurationValue);
    if (trialForm.trialDurationType === "CUSTOM_DATE" && trialForm.trialCustomEndDate) {
      fd.set("trialCustomEndDate", trialForm.trialCustomEndDate);
    }
    if (trialForm.defaultTrialPlanId !== "none") {
      fd.set("defaultTrialPlanId", trialForm.defaultTrialPlanId);
    }
    fd.set("allowTrialOnCreate", String(trialForm.allowTrialOnCreate));

    startTransition(async () => {
      const result = await saveBillingSettings(fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Trial settings updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan Management</h1>
          <p className="text-zinc-500">
            Dynamic pricing, trial control, limits, features, visibility, and lifecycle.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trial Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitTrialSettings} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Trial Duration Type</Label>
              <Select
                value={trialForm.trialDurationType}
                onValueChange={(value) =>
                  setTrialForm((current) => ({
                    ...current,
                    trialDurationType: value as PlanDurationType,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAYS">Days</SelectItem>
                  <SelectItem value="WEEKS">Weeks</SelectItem>
                  <SelectItem value="MONTHS">Months</SelectItem>
                  <SelectItem value="YEARS">Years</SelectItem>
                  <SelectItem value="CUSTOM_DATE">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trial Duration Value</Label>
              <Input
                type="number"
                min="1"
                value={trialForm.trialDurationValue}
                onChange={(e) => setTrialForm((current) => ({ ...current, trialDurationValue: e.target.value }))}
                disabled={trialForm.trialDurationType === "CUSTOM_DATE"}
              />
              <div className="flex flex-wrap gap-2">
                {TRIAL_DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTrialForm((current) => ({
                        ...current,
                        trialDurationType: preset.type,
                        trialDurationValue: String(preset.value),
                      }))
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Trial Plan</Label>
              <Select
                value={trialForm.defaultTrialPlanId}
                onValueChange={(value) => setTrialForm((current) => ({ ...current, defaultTrialPlanId: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto select</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Allow Trial On Mess Create</Label>
              <div className="flex h-10 items-center gap-3 rounded-lg border px-3">
                <Switch
                  checked={trialForm.allowTrialOnCreate}
                  onCheckedChange={(value) => setTrialForm((current) => ({ ...current, allowTrialOnCreate: value }))}
                />
                <span className="text-sm text-zinc-600">Automatically assign trial</span>
              </div>
            </div>
            {trialForm.trialDurationType === "CUSTOM_DATE" && (
              <div className="space-y-2 md:col-span-2">
                <Label>Custom Trial Expiry</Label>
                <Input
                  type="date"
                  value={trialForm.trialCustomEndDate}
                  onChange={(e) => setTrialForm((current) => ({ ...current, trialCustomEndDate: e.target.value }))}
                />
              </div>
            )}
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit" disabled={pending}>Save Trial Settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Plan" : "New Plan"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPlan} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={form.visibility}
                    onValueChange={(value) => setForm({ ...form, visibility: value as PlanVisibility })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="HIDDEN">Hidden</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Members Limit</Label>
                  <Input type="number" value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration Type</Label>
                  <Select
                    value={form.durationType}
                    onValueChange={(value) => setForm({ ...form, durationType: value as PlanDurationType })}
                  >
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
                <div className="space-y-2 md:col-span-2 xl:col-span-4">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Duration Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setForm({ ...form, durationType: preset.type, durationValue: String(preset.value) })}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Plan Limits</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {PLAN_LIMIT_KEYS.filter((key) => key !== "members").map((key) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{PLAN_LIMIT_LABELS[key]}</Label>
                      <Input
                        type="number"
                        placeholder="-1 = unlimited"
                        value={form.limits[key] ?? ""}
                        onChange={(e) => setForm({ ...form, limits: { ...form.limits, [key]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Feature Toggles</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Object.entries(PLAN_FEATURE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                      <Switch
                        checked={form.features.includes(key as PlanFeatureKey)}
                        onCheckedChange={() => toggleFeature(key as PlanFeatureKey)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.isActive} onCheckedChange={(value) => setForm({ ...form, isActive: value })} /> Active</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.isDefault} onCheckedChange={(value) => setForm({ ...form, isDefault: value })} /> Default</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.isPopular} onCheckedChange={(value) => setForm({ ...form, isPopular: value })} /> Popular</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.isTrialPlan} onCheckedChange={(value) => setForm({ ...form, isTrialPlan: value })} /> Trial Plan</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.isArchived} onCheckedChange={(value) => setForm({ ...form, isArchived: value })} /> Archived</label>
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
            <Card key={plan.id} className={!plan.isActive ? "opacity-70" : ""}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {plan.name}
                    {plan.badge && <Badge>{plan.badge}</Badge>}
                    {plan.isPopular && <Badge variant="secondary">Popular</Badge>}
                    {plan.isDefault && <Badge variant="outline">Default</Badge>}
                    {plan.isTrialPlan && <Badge variant="outline">Trial</Badge>}
                  </CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">{formatPlanDuration(parsed)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDuplicate(plan.id)}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-2xl font-bold">
                  {plan.price === 0 && plan.visibility !== "PUBLIC" ? "Custom" : formatCurrency(plan.price, plan.currency)}
                </p>
                <p className="text-zinc-500">
                  {plan.maxMembers === -1 ? "Unlimited members" : `Up to ${plan.maxMembers} members`}
                </p>
                <p className="text-zinc-500">{plan._count.subscriptions} subscriptions</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{plan.visibility}</Badge>
                  {plan.isArchived && <Badge variant="secondary">Archived</Badge>}
                  {!plan.isActive && <Badge variant="secondary">Disabled</Badge>}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {parsePlanFeatures(plan.features).slice(0, 5).map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {PLAN_FEATURE_LABELS[feature as keyof typeof PLAN_FEATURE_LABELS] ?? feature}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleLifecycle(plan.id, plan.isActive ? "disable" : "enable")}>
                    <Power className="mr-1 h-3.5 w-3.5" />
                    {plan.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleLifecycle(plan.id, plan.visibility === "PUBLIC" ? "hide" : "show")}>
                    {plan.visibility === "PUBLIC" ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
                    {plan.visibility === "PUBLIC" ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleLifecycle(plan.id, "archive")}>
                    <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

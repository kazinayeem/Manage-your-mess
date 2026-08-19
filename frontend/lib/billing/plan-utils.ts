import type { Plan, PlanDurationType, PlanVisibility } from "@prisma/client";
import {
  LEGACY_FEATURE_MAP,
  type PlanFeatureKey,
  type PlanLimitKey,
} from "@/lib/billing/constants";

export type ParsedPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  durationType: PlanDurationType;
  durationValue: number;
  customExpiryDate: Date | null;
  maxMembers: number;
  limits: Record<PlanLimitKey, number>;
  features: PlanFeatureKey[];
  featureToggles: Record<string, boolean>;
  isActive: boolean;
  isDefault: boolean;
  isPopular: boolean;
  isTrialPlan: boolean;
  visibility: PlanVisibility;
  isArchived: boolean;
  badge: string | null;
  color: string | null;
  tier: string | null;
};

export function parsePlanLimits(raw: string | null | undefined): Record<string, number> {
  try {
    return JSON.parse(raw || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export function parsePlanFeatures(raw: string | null | undefined): string[] {
  try {
    return JSON.parse(raw || "[]") as string[];
  } catch {
    return [];
  }
}

export function parseFeatureToggles(raw: string | null | undefined): Record<string, boolean> {
  try {
    return JSON.parse(raw || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function serializePlanJson(
  limits: Record<string, number>,
  features: string[],
  toggles: Record<string, boolean>
) {
  return {
    limits: JSON.stringify(limits),
    features: JSON.stringify(features),
    featureToggles: JSON.stringify(toggles),
  };
}

export function toParsedPlan(plan: Plan): ParsedPlan {
  const limits = parsePlanLimits(plan.limits);
  const features = parsePlanFeatures(plan.features) as PlanFeatureKey[];
  const featureToggles = parseFeatureToggles(plan.featureToggles);

  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: plan.currency,
    durationType: plan.durationType,
    durationValue: plan.durationValue,
    customExpiryDate: plan.customExpiryDate,
    maxMembers: plan.maxMembers,
    limits: {
      members: limits.members ?? plan.maxMembers,
      branches: limits.branches ?? 1,
      storage_mb: limits.storage_mb ?? 100,
      reports: limits.reports ?? -1,
      pdf_exports: limits.pdf_exports ?? -1,
      excel_exports: limits.excel_exports ?? -1,
      csv_exports: limits.csv_exports ?? -1,
      monthly_transactions: limits.monthly_transactions ?? -1,
      api_requests: limits.api_requests ?? -1,
      bazaar_entries: limits.bazaar_entries ?? -1,
      expenses: limits.expenses ?? -1,
      bills: limits.bills ?? -1,
      notices: limits.notices ?? -1,
      tasks: limits.tasks ?? -1,
    },
    features,
    featureToggles,
    isActive: plan.isActive,
    isDefault: plan.isDefault,
    isPopular: plan.isPopular,
    isTrialPlan: plan.isTrialPlan,
    visibility: plan.visibility,
    isArchived: plan.isArchived,
    badge: plan.badge,
    color: plan.color,
    tier: plan.tier,
  };
}

export function planHasFeature(plan: ParsedPlan | Plan, feature: string): boolean {
  const parsed = "limits" in plan && typeof plan.limits === "object" && !Array.isArray(plan.limits)
    ? (plan as ParsedPlan)
    : toParsedPlan(plan as Plan);
  const key = LEGACY_FEATURE_MAP[feature] ?? feature;

  if (parsed.featureToggles[key] === false) return false;
  if (parsed.featureToggles[key] === true) return true;

  if (parsed.features.includes(key as PlanFeatureKey)) return true;

  // Legacy features array support
  const legacyFeatures = parsePlanFeatures(
    "features" in plan && typeof plan.features === "string" ? plan.features : JSON.stringify(parsed.features)
  );
  return legacyFeatures.includes(feature) || legacyFeatures.includes(key);
}

export function getPlanLimit(plan: ParsedPlan | Plan, limit: PlanLimitKey): number {
  const parsed =
    "limits" in plan && typeof plan.limits === "object" && !Array.isArray(plan.limits)
      ? (plan as ParsedPlan)
      : toParsedPlan(plan as Plan);
  return parsed.limits[limit] ?? -1;
}

export function isPlanVisible(plan: ParsedPlan | Plan): boolean {
  const parsed = "limits" in plan ? (plan as ParsedPlan) : toParsedPlan(plan as Plan);
  return parsed.isActive && !parsed.isArchived && parsed.visibility === "PUBLIC";
}

export function getMemberLimit(plan: ParsedPlan | Plan): number {
  const parsed = "limits" in plan && typeof plan.limits === "object" && !Array.isArray(plan.limits)
    ? (plan as ParsedPlan)
    : toParsedPlan(plan as Plan);
  if (planHasFeature(parsed, "unlimited_members")) return -1;
  return parsed.limits.members ?? parsed.maxMembers;
}

export function formatPlanDuration(plan: ParsedPlan | Plan): string {
  const p = "limits" in plan ? plan : toParsedPlan(plan);
  if (p.durationType === "CUSTOM_DATE" && p.customExpiryDate) {
    return `Until ${p.customExpiryDate.toLocaleDateString()}`;
  }
  const unit =
    p.durationType === "DAYS"
      ? p.durationValue === 1
        ? "day"
        : "days"
      : p.durationType === "WEEKS"
        ? p.durationValue === 1
          ? "week"
          : "weeks"
        : p.durationType === "MONTHS"
          ? p.durationValue === 1
            ? "month"
            : "months"
          : p.durationValue === 1
            ? "year"
            : "years";
  return `${p.durationValue} ${unit}`;
}

export function calculatePeriodEnd(
  start: Date,
  durationType: PlanDurationType,
  durationValue: number,
  customExpiryDate?: Date | null
): Date {
  if (durationType === "CUSTOM_DATE" && customExpiryDate) {
    return new Date(customExpiryDate);
  }
  const end = new Date(start);
  switch (durationType) {
    case "DAYS":
      end.setDate(end.getDate() + durationValue);
      break;
    case "WEEKS":
      end.setDate(end.getDate() + durationValue * 7);
      break;
    case "MONTHS":
      end.setMonth(end.getMonth() + durationValue);
      break;
    case "YEARS":
      end.setFullYear(end.getFullYear() + durationValue);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export function daysRemaining(endDate: Date): number {
  const diff = endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function isSubscriptionActive(status: string, endDate: Date): boolean {
  if (status === "SUSPENDED" || status === "CANCELLED" || status === "EXPIRED") return false;
  if (status === "PENDING") return false;
  return endDate > new Date();
}

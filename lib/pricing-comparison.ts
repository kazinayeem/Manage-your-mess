import type { LucideIcon } from "lucide-react";
import {
  Users,
  GitBranch,
  Utensils,
  Receipt,
  Wallet,
  Zap,
  ShoppingCart,
  FileText,
  FileSpreadsheet,
  Table2,
  BarChart3,
  Sparkles,
  DoorOpen,
  BedDouble,
  UserCheck,
  Bell,
  Headphones,
  Shield,
  Palette,
  Code,
  Tag,
  HardDrive,
  UserCog,
  FileCheck,
  Plug,
} from "lucide-react";
import type { ParsedPlan } from "@/lib/billing/plan-utils";
import type { PlanFeatureKey } from "@/lib/billing/constants";

export type ComparisonRowId =
  | "members"
  | "branches"
  | "meal_tracking"
  | "expense_tracking"
  | "deposits"
  | "utility_bills"
  | "bazaar_management"
  | "pdf_export"
  | "excel_export"
  | "csv_export"
  | "analytics"
  | "ai_insights"
  | "room_management"
  | "bed_management"
  | "visitor_management"
  | "notifications"
  | "priority_support"
  | "audit_logs"
  | "custom_branding"
  | "api_access"
  | "white_label"
  | "storage"
  | "dedicated_manager"
  | "sla"
  | "custom_integrations";

export type ComparisonRowDef = {
  id: ComparisonRowId;
  icon: LucideIcon;
};

export const COMPARISON_ROWS: ComparisonRowDef[] = [
  { id: "members", icon: Users },
  { id: "branches", icon: GitBranch },
  { id: "meal_tracking", icon: Utensils },
  { id: "expense_tracking", icon: Receipt },
  { id: "deposits", icon: Wallet },
  { id: "utility_bills", icon: Zap },
  { id: "bazaar_management", icon: ShoppingCart },
  { id: "pdf_export", icon: FileText },
  { id: "excel_export", icon: FileSpreadsheet },
  { id: "csv_export", icon: Table2 },
  { id: "analytics", icon: BarChart3 },
  { id: "ai_insights", icon: Sparkles },
  { id: "room_management", icon: DoorOpen },
  { id: "bed_management", icon: BedDouble },
  { id: "visitor_management", icon: UserCheck },
  { id: "notifications", icon: Bell },
  { id: "priority_support", icon: Headphones },
  { id: "audit_logs", icon: Shield },
  { id: "custom_branding", icon: Palette },
  { id: "api_access", icon: Code },
  { id: "white_label", icon: Tag },
  { id: "storage", icon: HardDrive },
  { id: "dedicated_manager", icon: UserCog },
  { id: "sla", icon: FileCheck },
  { id: "custom_integrations", icon: Plug },
];

const FEATURE_MAP: Partial<Record<ComparisonRowId, PlanFeatureKey>> = {
  meal_tracking: "meal_tracking",
  expense_tracking: "expense_tracking",
  deposits: "deposit_tracking",
  utility_bills: "advanced_reports",
  bazaar_management: "advanced_reports",
  pdf_export: "pdf_reports",
  excel_export: "excel_reports",
  csv_export: "csv_export",
  analytics: "advanced_analytics",
  ai_insights: "ai_analytics",
  room_management: "room_management",
  bed_management: "bed_management",
  visitor_management: "visitor_management",
  notifications: "email_notifications",
  priority_support: "priority_support",
  audit_logs: "audit_logs",
  custom_branding: "custom_branding",
  api_access: "api_access",
  white_label: "white_label",
  custom_integrations: "white_label",
};

/** Marketing defaults when DB plan features differ */
const TIER_DEFAULTS: Record<string, Partial<Record<ComparisonRowId, boolean>>> = {
  free: {
    meal_tracking: true,
    expense_tracking: true,
    deposits: true,
    analytics: false,
    utility_bills: false,
    bazaar_management: false,
    pdf_export: false,
    excel_export: false,
    csv_export: false,
    ai_insights: false,
  },
  pro: {
    meal_tracking: true,
    expense_tracking: true,
    deposits: true,
    utility_bills: true,
    bazaar_management: true,
    pdf_export: true,
    excel_export: true,
    analytics: true,
    csv_export: false,
    ai_insights: false,
    priority_support: true,
  },
  business: {
    meal_tracking: true,
    expense_tracking: true,
    deposits: true,
    utility_bills: true,
    bazaar_management: true,
    pdf_export: true,
    excel_export: true,
    csv_export: true,
    analytics: true,
    ai_insights: true,
    room_management: true,
    bed_management: true,
    visitor_management: true,
    audit_logs: true,
    custom_branding: true,
    priority_support: true,
  },
  enterprise: Object.fromEntries(
    COMPARISON_ROWS.filter((r) => !["members", "branches", "storage"].includes(r.id)).map((r) => [
      r.id,
      true,
    ])
  ) as Partial<Record<ComparisonRowId, boolean>>,
};

function hasPlanFeature(plan: ParsedPlan, key: PlanFeatureKey) {
  return plan.features.includes(key);
}

export type ComparisonValue = boolean | string;

export function getComparisonValue(
  plan: ParsedPlan,
  rowId: ComparisonRowId,
  t: (key: string) => string
): ComparisonValue {
  const tier = plan.slug;
  const defaults = TIER_DEFAULTS[tier];

  if (rowId === "members") {
    return plan.maxMembers === -1 ? t("unlimited") : String(plan.maxMembers);
  }
  if (rowId === "branches") {
    const n = plan.limits.branches ?? 1;
    return n === -1 ? t("unlimited") : String(n);
  }
  if (rowId === "storage") {
    const mb = plan.limits.storage_mb ?? 100;
    return mb === -1 ? t("unlimited") : `${mb} MB`;
  }
  if (rowId === "dedicated_manager" || rowId === "sla") {
    return tier === "enterprise" || (defaults?.[rowId] ?? false);
  }

  const featureKey = FEATURE_MAP[rowId];
  if (featureKey) {
    const fromPlan = hasPlanFeature(plan, featureKey);
    const fromTier = defaults?.[rowId];
    if (fromTier !== undefined) return fromTier;
    return fromPlan;
  }

  return defaults?.[rowId] ?? false;
}

export type PlanCardSlug = "free" | "pro" | "business" | "enterprise";

export const PLAN_CARD_SLUGS: PlanCardSlug[] = ["free", "pro", "business", "enterprise"];

export function sortPlansForDisplay(plans: ParsedPlan[]) {
  const order = PLAN_CARD_SLUGS;
  return [...plans].sort((a, b) => {
    const ai = order.indexOf(a.slug as PlanCardSlug);
    const bi = order.indexOf(b.slug as PlanCardSlug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function getPlanCtaHref(plan: ParsedPlan, isLoggedIn: boolean) {
  if (plan.slug === "enterprise") return "/contact";
  if (plan.slug === "free") return isLoggedIn ? "/portal/create-mess" : "/register";
  return isLoggedIn ? `/pricing/subscribe/${plan.id}` : `/register?plan=${plan.id}`;
}

export function getPlanCtaLabel(plan: ParsedPlan, t: (key: string) => string) {
  if (plan.slug === "enterprise") return t("cta.contactSales");
  if (plan.slug === "free") return t("cta.startFree");
  return t("cta.upgradeNow");
}

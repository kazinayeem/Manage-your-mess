import { getMemberLimit, planHasFeature, type ParsedPlan } from "@/lib/billing/plan-utils";
import { PLAN_FEATURES, type PlanFeatureKey } from "@/lib/billing/constants";
import type { Plan } from "@prisma/client";

export const FEATURES = PLAN_FEATURES;
export type FeatureKey = PlanFeatureKey;

export function canUseFeature(
  plan: ParsedPlan | Plan | null | undefined,
  feature: FeatureKey | string
): boolean {
  if (!plan) return false;
  return planHasFeature(plan, feature);
}

export function getMemberLimitForPlan(plan: ParsedPlan | Plan | null | undefined): number {
  if (!plan) return 10;
  return getMemberLimit(plan);
}

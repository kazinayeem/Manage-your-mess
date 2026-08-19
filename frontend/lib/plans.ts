/**
 * Plan helpers — feature keys and legacy tier types.
 * Plan data is loaded from the database; use getActivePlans() / toParsedPlan().
 */
export { PLAN_FEATURES as FEATURES, type PlanFeatureKey } from "@/lib/billing/constants";
export {
  planHasFeature,
  getMemberLimit,
  toParsedPlan,
  type ParsedPlan,
} from "@/lib/billing/plan-utils";

/** @deprecated Use plan slug or ParsedPlan from database */
export const PlanTier = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

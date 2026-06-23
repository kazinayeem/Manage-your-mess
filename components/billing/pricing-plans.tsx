import { LandingPlanComparison } from "@/components/landing/plan-comparison";
import type { ParsedPlan } from "@/lib/billing/plan-utils";

export function PricingPlans({
  plans,
  isLoggedIn,
}: {
  plans: ParsedPlan[];
  isLoggedIn: boolean;
}) {
  return <LandingPlanComparison plans={plans} isLoggedIn={isLoggedIn} showPageHero />;
}

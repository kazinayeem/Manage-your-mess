import { apiGet } from "@/lib/api-client";
import { auth } from "@/lib/auth";
import { LandingPlanComparison } from "@/components/landing/plan-comparison";

export async function LandingPricingSection() {
  const [plansRes, session] = await Promise.all([
    apiGet("/billing/plans"),
    auth(),
  ]);
  const plans = plansRes?.data || plansRes || [];
  return <LandingPlanComparison plans={Array.isArray(plans) ? plans : []} isLoggedIn={!!session?.user} />;
}

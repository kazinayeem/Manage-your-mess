import { getActivePlans } from "@/actions/billing";
import { auth } from "@/lib/auth";
import { LandingPlanComparison } from "@/components/landing/plan-comparison";

export async function LandingPricingSection() {
  const [plans, session] = await Promise.all([getActivePlans(), auth()]);
  return <LandingPlanComparison plans={plans} isLoggedIn={!!session?.user} />;
}

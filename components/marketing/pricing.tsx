import { getActivePlans } from "@/actions/billing";
import { auth } from "@/lib/auth";
import { PricingPlans } from "@/components/billing/pricing-plans";

export async function PricingCards() {
  const [plans, session] = await Promise.all([getActivePlans(), auth()]);
  return <PricingPlans plans={plans} isLoggedIn={!!session?.user} />;
}

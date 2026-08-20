import { apiGet } from "@/lib/api-client";
import { auth } from "@/lib/auth";
import { PricingPlans } from "@/components/billing/pricing-plans";

export async function PricingCards() {
  const [plansRes, session] = await Promise.all([
    apiGet("/billing/plans"),
    auth(),
  ]);
  const plans = plansRes?.data || plansRes || [];
  return <PricingPlans plans={Array.isArray(plans) ? plans : []} isLoggedIn={!!session?.user} />;
}

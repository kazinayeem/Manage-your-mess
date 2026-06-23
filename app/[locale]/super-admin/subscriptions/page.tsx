import { getAllPlans, getAllSubscriptions } from "@/actions/billing";
import { SubscriptionsManager } from "@/components/billing/subscriptions-manager";

export default async function SuperAdminSubscriptionsPage() {
  const [subscriptions, plans] = await Promise.all([getAllSubscriptions(), getAllPlans()]);
  return <SubscriptionsManager subscriptions={subscriptions} plans={plans} />;
}

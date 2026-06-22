import { getAllSubscriptions } from "@/actions/billing";
import { SubscriptionsManager } from "@/components/billing/subscriptions-manager";

export default async function SuperAdminSubscriptionsPage() {
  const subscriptions = await getAllSubscriptions();
  return <SubscriptionsManager subscriptions={subscriptions} />;
}

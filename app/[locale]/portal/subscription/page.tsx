import { getUserSubscription } from "@/actions/billing";
import { SubscriptionDashboard } from "@/components/portal/subscription-dashboard";

export default async function PortalSubscriptionPage() {
  const subscription = await getUserSubscription();
  return <SubscriptionDashboard subscription={subscription} />;
}

import { apiGet } from "@/lib/api-client";
import { getUserSubscriptionAccess } from "@/lib/billing/subscription-access";
import { SubscriptionDashboard } from "@/components/portal/subscription-dashboard";
import { requireAuth } from "@/lib/mess-access";

export default async function PortalSubscriptionPage() {
  const user = await requireAuth();
  const res = await apiGet("/billing/subscription");
  const subscription = res?.data || null;
  const access = await getUserSubscriptionAccess(user.id);
  return <SubscriptionDashboard subscription={subscription} access={access} />;
}

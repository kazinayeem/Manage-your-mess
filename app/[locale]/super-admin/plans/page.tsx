import { getAllPlans, getBillingSettings } from "@/actions/billing";
import { PlansManager } from "@/components/billing/plans-manager";

export default async function SuperAdminPlansPage() {
  const [plans, settings] = await Promise.all([getAllPlans(), getBillingSettings()]);
  return <PlansManager plans={plans as never} settings={settings} />;
}

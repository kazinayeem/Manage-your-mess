import { getAllPlans } from "@/actions/billing";
import { PlansManager } from "@/components/billing/plans-manager";

export default async function SuperAdminPlansPage() {
  const plans = await getAllPlans();
  return <PlansManager plans={plans} />;
}

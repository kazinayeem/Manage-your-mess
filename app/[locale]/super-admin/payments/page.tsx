import { getPaymentRequests } from "@/actions/billing";
import { PaymentsManager } from "@/components/billing/payments-manager";

export default async function SuperAdminPaymentsPage() {
  const requests = await getPaymentRequests();
  return <PaymentsManager requests={requests} />;
}

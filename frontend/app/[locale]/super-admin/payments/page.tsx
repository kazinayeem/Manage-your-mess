import { getPaymentRequestsForAdmin } from "@/actions/billing";
import { PaymentsManager } from "@/components/billing/payments-manager";

export default async function SuperAdminPaymentsPage() {
  const requests = await getPaymentRequestsForAdmin({ status: "ALL" });
  return <PaymentsManager requests={requests} />;
}

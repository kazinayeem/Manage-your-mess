import { getMyPaymentRequests } from "@/actions/billing";
import { PaymentsHistory } from "@/components/portal/payments-history";

export default async function PortalPaymentsPage() {
  const payments = await getMyPaymentRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payments</h1>
        <p className="text-zinc-500">
          Track every submitted payment request, approval decision, and subscription activation.
        </p>
      </div>
      <PaymentsHistory payments={payments} />
    </div>
  );
}

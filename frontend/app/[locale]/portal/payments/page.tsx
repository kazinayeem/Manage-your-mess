import { apiGet } from "@/lib/api-client";
import { PaymentsHistory } from "@/components/portal/payments-history";

export default async function PortalPaymentsPage() {
  const res = await apiGet("/billing/payments/my");
  const payments = res?.data || res || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payments</h1>
        <p className="text-zinc-500">
          Track every submitted payment request, approval decision, and subscription activation.
        </p>
      </div>
      <PaymentsHistory payments={Array.isArray(payments) ? payments : []} />
    </div>
  );
}

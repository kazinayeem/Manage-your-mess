import { getPaymentMethods } from "@/actions/billing";
import { PaymentMethodsManager } from "@/components/billing/payment-methods-manager";

export default async function SuperAdminPaymentMethodsPage() {
  const methods = await getPaymentMethods();
  return <PaymentMethodsManager methods={methods} />;
}

import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { apiGet } from "@/lib/api-client";
import { toParsedPlan } from "@/lib/billing/plan-utils";
import { SubscriptionRequestForm } from "@/components/billing/subscription-request-form";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ locale: string; planId: string }>;
}) {
  const { locale, planId } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/pricing/subscribe/${planId}`);

  const [plansRes, methodsRes, messesRes] = await Promise.all([
    apiGet("/billing/plans"),
    apiGet("/billing/payment-methods"),
    apiGet("/messes"),
  ]);

  const plans = plansRes?.data || plansRes || [];
  const planRecord = Array.isArray(plans) ? plans.find((p: any) => p.id === planId) : null;
  if (!planRecord) notFound();

  const paymentMethods = methodsRes?.data || methodsRes || [];
  const messes = (messesRes?.data || messesRes || []).map((m: any) => ({
    id: m.id || m.messId,
    name: m.name,
  }));

  if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
    return (
      <div className="flex min-h-full flex-col">
        <MarketingHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-zinc-500">No payment methods configured yet. Please contact support.</p>
        </main>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1 px-4 py-12">
        <SubscriptionRequestForm
          plan={toParsedPlan(planRecord)}
          paymentMethods={paymentMethods}
          messes={messes}
        />
      </main>
      <MarketingFooter />
    </div>
  );
}

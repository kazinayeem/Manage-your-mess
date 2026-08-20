import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { apiGet } from "@/lib/api-client";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [session, plansRes] = await Promise.all([auth(), apiGet("/billing/plans")]);
  const plans = plansRes?.data || plansRes || [];

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <PricingPlans plans={Array.isArray(plans) ? plans : []} isLoggedIn={!!session?.user} />
      </main>
      <MarketingFooter />
    </div>
  );
}

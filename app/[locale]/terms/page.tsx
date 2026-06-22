import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-20 prose dark:prose-invert">
        <h1>Terms of Service</h1>
        <p>Last updated: June 2026</p>
        <p>By using MessFlow Pro, you agree to these terms of service.</p>
        <h2>Service Description</h2>
        <p>MessFlow Pro provides mess and hostel management software on a subscription basis.</p>
        <h2>User Responsibilities</h2>
        <p>You are responsible for maintaining the security of your account and the accuracy of data entered.</p>
        <h2>Subscription & Billing</h2>
        <p>Paid plans are billed monthly. You may cancel at any time. Refunds are handled per our refund policy.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}

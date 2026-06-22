import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function PrivacyPage({
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
        <h1>Privacy Policy</h1>
        <p>Last updated: June 2026</p>
        <p>
          MessFlow Pro (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
          This policy describes how we collect, use, and safeguard your personal information.
        </p>
        <h2>Information We Collect</h2>
        <p>We collect information you provide directly, including name, email, phone, and mess management data.</p>
        <h2>How We Use Your Information</h2>
        <p>We use your information to provide and improve our services, process payments, and send notifications.</p>
        <h2>Data Security</h2>
        <p>We implement industry-standard security measures including encryption, rate limiting, and audit logging.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}

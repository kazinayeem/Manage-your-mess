import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { LegalPage } from "@/components/marketing/legal-page";
import { getLegalDocument } from "@/lib/legal-content";

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const document = getLegalDocument(locale, "cookies");

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <LegalPage document={document} locale={locale} />
      <MarketingFooter />
    </div>
  );
}

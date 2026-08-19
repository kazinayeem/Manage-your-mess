import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { FeaturesGrid } from "@/components/marketing/hero";

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1"><FeaturesGrid /></main>
      <MarketingFooter />
    </div>
  );
}

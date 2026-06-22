import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { HeroSection, FeaturesGrid } from "@/components/marketing/hero";
import { PricingCards } from "@/components/marketing/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${t("appName")} — ${t("tagline")}`,
    description: "Complete mess, hostel, PG and student accommodation management platform.",
    openGraph: {
      title: t("appName"),
      description: t("tagline"),
      type: "website",
      locale: locale === "bn" ? "bn_BD" : "en_US",
    },
    twitter: { card: "summary_large_image", title: t("appName") },
    alternates: {
      canonical: "/",
      languages: { en: "/en", bn: "/bn" },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <PricingCards />
      </main>
      <MarketingFooter />
    </div>
  );
}

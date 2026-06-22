import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/hero-section";
import { LandingTrust } from "@/components/landing/trust-section";
import { LandingDashboardPreview } from "@/components/landing/dashboard-preview";
import { LandingWhy } from "@/components/landing/why-section";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingFeatures } from "@/components/landing/features-section";
import { LandingAnalytics } from "@/components/landing/analytics-section";
import { LandingMobile } from "@/components/landing/mobile-section";
import { LandingTestimonials } from "@/components/landing/testimonials-section";
import { LandingPricingSection } from "@/components/landing/pricing-section";
import { LandingFaq } from "@/components/landing/faq-section";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingJsonLd } from "@/components/landing/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.seo" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "https://messflow.pro";
  const canonical = locale === "bn" ? `${baseUrl}/bn` : baseUrl;

  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "mess management",
      "hostel management",
      "বাংলা মেস ম্যানেজমেন্ট",
      "meal tracking",
      "bKash mess payment",
      "Bangladesh hostel software",
    ],
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale === "bn" ? "bn_BD" : "en_US",
      url: canonical,
      siteName: "MessFlow Pro",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      canonical: locale === "bn" ? "/bn" : "/",
      languages: { en: "/", bn: "/bn" },
    },
    robots: { index: true, follow: true },
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
    <div className="flex min-h-full flex-col bg-white dark:bg-zinc-950">
      <LandingJsonLd locale={locale} />
      <MarketingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingTrust />
        <LandingDashboardPreview />
        <LandingWhy />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingAnalytics />
        <LandingMobile />
        <LandingTestimonials />
        <LandingPricingSection />
        <LandingFaq />
        <LandingFinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}

import Script from "next/script";
import { getTranslations } from "next-intl/server";

export async function LandingJsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "landing.seo" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "https://messflow.pro";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BornoMess Manager",
    url: baseUrl,
    logo: `${baseUrl}/icon.svg`,
    description: t("description"),
    parentOrganization: {
      "@type": "Organization",
      name: "BornoSoft",
      url: "https://www.bornosoft.com",
    },
    sameAs: [
      "https://facebook.com/messflowpro",
      "https://linkedin.com/company/messflowpro",
      "https://github.com/kazinayeem/Manage-your-mess",
    ],
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BornoMess Manager",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "BDT" },
    description: t("description"),
  };

  const faqItems = Array.from({ length: 16 }, (_, i) => ({
    "@type": "Question",
    name: t(`faq.${i + 1}.q`),
    acceptedAnswer: { "@type": "Answer", text: t(`faq.${i + 1}.a`) },
  }));

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems,
  };

  return (
    <>
      <Script id="jsonld-organization" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <Script id="jsonld-software" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}

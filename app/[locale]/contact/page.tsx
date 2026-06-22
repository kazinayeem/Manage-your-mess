import { setRequestLocale, getTranslations } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { ContactForm } from "@/components/marketing/contact-form";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-20">
        <h1 className="text-3xl font-bold">{t("contact")}</h1>
        <ContactForm />
      </main>
      <MarketingFooter />
    </div>
  );
}

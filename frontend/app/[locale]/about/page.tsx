import { setRequestLocale, getTranslations } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-20">
        <h1 className="text-4xl font-bold">About {t("appName")}</h1>
        <p className="mt-6 text-lg text-zinc-600">
          MessFlow Pro is built for mess owners, hostel managers, and student accommodation
          providers across Bangladesh and internationally. We simplify meal tracking, expense
          management, deposit collection, and financial reporting so you can focus on your community.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}

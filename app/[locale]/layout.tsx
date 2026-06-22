import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Noto_Sans_Bengali, Hind_Siliguri } from "next/font/google";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { LocaleHtmlAttrs } from "@/components/locale-html-attrs";
import { cn } from "@/lib/utils";

import { PageTransition } from "@/components/motion/page-transition";

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali-display",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "bn")) notFound();

  setRequestLocale(locale);
  const [messages, session] = await Promise.all([getMessages(), auth()]);

  return (
    <>
      <LocaleHtmlAttrs locale={locale} />
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          locale === "bn" && [notoBengali.variable, hindSiliguri.variable, "locale-bn"]
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers session={session}>
            <PageTransition>{children}</PageTransition>
            <Toaster richColors position="top-right" />
          </Providers>
        </NextIntlClientProvider>
      </div>
    </>
  );
}

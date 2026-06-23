"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Globe, Mail, Share2 } from "lucide-react";
import { MARKETING_COVER } from "@/lib/marketing-images";

const BORNOSOFT_URL = "https://www.bornosoft.com";

export function MarketingFooter() {
  const t = useTranslations();
  const tf = useTranslations("landing.footer");

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-700">
                <Image src={MARKETING_COVER} alt="" fill className="object-cover" sizes="40px" />
              </div>
              <span className="text-lg font-bold">{t("common.appName")}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">{t("common.tagline")}</p>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {t("common.productOf")}{" "}
              <a
                href={BORNOSOFT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 hover:underline"
              >
                {t("common.companyName")}
              </a>
            </p>
            <a
              href={BORNOSOFT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-emerald-600 hover:underline"
            >
              www.bornosoft.com
            </a>
            <div className="mt-6 flex gap-3">
              <a
                href={BORNOSOFT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-800"
                aria-label="BornoSoft website"
              >
                <Share2 className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@bornosoft.com"
                className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-800"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href={BORNOSOFT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-800"
                aria-label="BornoSoft"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white">{tf("product")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li><Link href="/#features" className="hover:text-emerald-600">{t("nav.features")}</Link></li>
              <li><Link href="/#pricing" className="hover:text-emerald-600">{t("nav.pricing")}</Link></li>
              <li><Link href="/#faq" className="hover:text-emerald-600">{t("nav.faq")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white">{tf("company")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li><Link href="/about" className="hover:text-emerald-600">{t("nav.about")}</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-600">{t("nav.contact")}</Link></li>
              <li><Link href="/blog" className="hover:text-emerald-600">{t("nav.blog")}</Link></li>
              <li>
                <a href={BORNOSOFT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
                  BornoSoft
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white">{tf("legal")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li><Link href="/privacy" className="hover:text-emerald-600">{t("common.privacy")}</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-600">{t("common.terms")}</Link></li>
              <li>
                <a href="https://github.com/kazinayeem/Manage-your-mess" className="hover:text-emerald-600">
                  {tf("docs")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          © {new Date().getFullYear()} {t("common.appName")} — {t("common.productOf")}{" "}
          <a href={BORNOSOFT_URL} className="text-emerald-600 hover:underline">
            {t("common.companyName")}
          </a>
          . {tf("copyright")}
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function MarketingFooter() {
  const t = useTranslations();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                MF
              </div>
              <span className="font-bold">{t("common.appName")}</span>
            </div>
            <p className="mt-3 text-sm text-zinc-500">{t("common.tagline")}</p>
          </div>
          <div>
            <h4 className="font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li><Link href="/features" className="hover:text-emerald-600">{t("nav.features")}</Link></li>
              <li><Link href="/pricing" className="hover:text-emerald-600">{t("nav.pricing")}</Link></li>
              <li><Link href="/faq" className="hover:text-emerald-600">{t("nav.faq")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li><Link href="/about" className="hover:text-emerald-600">{t("nav.about")}</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-600">{t("nav.contact")}</Link></li>
              <li><Link href="/blog" className="hover:text-emerald-600">{t("nav.blog")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li><Link href="/privacy" className="hover:text-emerald-600">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-600">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          © {new Date().getFullYear()} MessFlow Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

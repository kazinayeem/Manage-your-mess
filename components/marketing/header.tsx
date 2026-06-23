"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function MarketingHeader() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/#features", label: t("nav.features") },
    { href: "/#pricing", label: t("nav.pricing") },
    { href: "/#faq", label: t("nav.faq") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            BM
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("common.appName")}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-emerald-600 dark:text-zinc-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <LocaleSwitcher />
          <Button variant="ghost" asChild>
            <Link href="/login">{t("common.login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/register">{t("common.getStarted")}</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="flex flex-col gap-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-zinc-600"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <ThemeToggle className="flex-1" />
              <LocaleSwitcher className="flex-1" />
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/login">{t("common.login")}</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/register">{t("common.getStarted")}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

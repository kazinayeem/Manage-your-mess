"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Home, Utensils, Receipt, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import Image from "next/image";
import { MARKETING_COVER } from "@/lib/marketing-images";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

export function MobileBottomNav({
  messId,
  unreadCount = 0,
}: {
  messId?: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const t = useTranslations("mobileNav");

  const tabs: Tab[] = messId
    ? [
        {
          href: messPath(messId),
          label: t("home"),
          icon: Home,
          match: (p) => p === messPath(messId),
        },
        {
          href: messPath(messId, "/meals"),
          label: t("meals"),
          icon: Utensils,
          match: (p) => p.startsWith(messPath(messId, "/meals")),
        },
        {
          href: messPath(messId, "/expenses"),
          label: t("expenses"),
          icon: Receipt,
          match: (p) => p.startsWith(messPath(messId, "/expenses")),
        },
        {
          href: messPath(messId, "/reports"),
          label: t("reports"),
          icon: FileText,
          match: (p) => p.startsWith(messPath(messId, "/reports")),
        },
        {
          href: "/portal/profile",
          label: t("profile"),
          icon: User,
          match: (p) => p.startsWith("/portal/profile"),
        },
      ]
    : [
        { href: "/portal", label: t("home"), icon: Home, match: (p) => p === "/portal" },
        {
          href: "/portal/notifications",
          label: t("alerts"),
          icon: FileText,
          match: (p) => p.startsWith("/portal/notifications"),
        },
        {
          href: "/portal/subscription",
          label: t("billing"),
          icon: Receipt,
          match: (p) => p.startsWith("/portal/subscription"),
        },
        {
          href: "/portal/settings",
          label: t("settings"),
          icon: Utensils,
          match: (p) => p.startsWith("/portal/settings"),
        },
        {
          href: "/portal/profile",
          label: t("profile"),
          icon: User,
          match: (p) => p.startsWith("/portal/profile"),
        },
      ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/90 lg:hidden"
      aria-label={t("mainNavigation")}
    >
      <div className="relative h-1 w-full overflow-hidden">
        <Image
          src={MARKETING_COVER}
          alt=""
          fill
          aria-hidden
          className="object-cover object-top opacity-30 dark:opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 via-teal-500/30 to-emerald-600/40" />
      </div>
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const badge =
            tab.href.includes("notifications") && unreadCount > 0 ? unreadCount : 0;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors touch-manipulation",
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-x-2 top-1 h-0.5 rounded-full bg-emerald-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

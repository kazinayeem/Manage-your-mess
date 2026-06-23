"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Home,
  Wallet,
  ShoppingCart,
  BarChart3,
  MoreHorizontal,
  Settings,
  LayoutGrid,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import {
  buildMessNavGroups,
  isBazaarRoute,
  isFinanceRoute,
  isReportsRoute,
  PORTAL_MORE_LINKS,
} from "@/lib/mess-navigation";
import type { MessCapabilities } from "@/lib/mess-permissions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";

type MessMobileNavProps = {
  messId: string;
  capabilities: MessCapabilities;
  isManager: boolean;
  isOwner: boolean;
  unreadCount?: number;
};

export function MessMobileBottomNav({
  messId,
  capabilities,
  isManager,
  isOwner,
  unreadCount: _unreadCount = 0,
}: MessMobileNavProps) {
  void _unreadCount;
  const pathname = usePathname();
  const t = useTranslations("mobileNav");
  const tSidebar = useTranslations("sidebar");
  const [moreOpen, setMoreOpen] = useState(false);
  const groups = buildMessNavGroups(messId, capabilities, isManager, isOwner);

  const homeActive = pathname === messPath(messId);
  const financeActive = isFinanceRoute(pathname, messId);
  const bazaarActive = isBazaarRoute(pathname, messId);
  const reportsActive = isReportsRoute(pathname, messId);
  const locked = capabilities.subscriptionLocked;

  const tabs = [
    {
      id: "home",
      href: messPath(messId),
      label: t("home"),
      icon: Home,
      active: homeActive,
    },
    {
      id: "finance",
      href: locked
        ? "/portal/subscription"
        : messPath(messId, capabilities.readOnly ? "/deposits" : "/deposits/add"),
      label: t("finance"),
      icon: Wallet,
      active: financeActive,
    },
    {
      id: "bazaar",
      href: locked
        ? "/pricing"
        : messPath(messId, capabilities.canManageBazaar ? "/bazaar" : "/bazaar/my"),
      label: t("bazaar"),
      icon: ShoppingCart,
      active: bazaarActive,
    },
    {
      id: "reports",
      href: locked ? "/pricing" : messPath(messId, "/reports"),
      label: t("reports"),
      icon: BarChart3,
      active: reportsActive,
    },
    {
      id: "more",
      href: "#more",
      label: t("more"),
      icon: MoreHorizontal,
      active: moreOpen,
      onClick: () => setMoreOpen(true),
    },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/60 bg-white/85 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_30px_rgb(0,0,0/0.06)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90 lg:hidden"
        aria-label={t("mainNavigation")}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isMore = tab.id === "more";

            const content = (
              <>
                {tab.active && !isMore && (
                  <motion.span
                    layoutId="mess-mobile-nav-pill"
                    className="absolute inset-x-1 top-0.5 bottom-0.5 -z-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={tab.active ? 2.25 : 1.75} />
                </span>
                <span className="truncate">{tab.label}</span>
              </>
            );

            const className = cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-medium transition-colors touch-manipulation",
              tab.active
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            );

            if (isMore) {
              return (
                <li key={tab.id} className="flex-1">
                  <button type="button" className={className} onClick={() => setMoreOpen(true)}>
                    {content}
                  </button>
                </li>
              );
            }

            return (
              <li key={tab.id} className="flex-1">
                <Link href={tab.href} className={className}>
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="px-0">
          <SheetHeader>
            <SheetTitle>{t("moreMenu")}</SheetTitle>
          </SheetHeader>
          <div className="max-h-[60dvh] overflow-y-auto px-4 pb-6">
            {groups.map((group) => (
              <div key={group.id} className="mb-4">
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {tSidebar(group.labelKey)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-3 text-sm font-medium text-zinc-800 transition-colors hover:border-emerald-200 hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/40"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="truncate">{tSidebar(item.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {t("portalSection")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/portal"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 px-3 py-3 text-sm font-medium dark:border-zinc-800"
              >
                <LayoutGrid className="h-4 w-4 text-emerald-600" />
                {tSidebar("portalHome")}
              </Link>
              <Link
                href="/portal/settings"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 px-3 py-3 text-sm font-medium dark:border-zinc-800"
              >
                <Settings className="h-4 w-4 text-emerald-600" />
                {t("settings")}
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200/80 p-3 dark:border-zinc-800">
              <ThemeToggle showLabel />
              <LocaleSwitcher />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Portal-level mobile nav (no mess context) */
export function PortalMobileBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const t = useTranslations("mobileNav");
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = [
    { href: "/portal", label: t("home"), icon: Home, match: (p: string) => p === "/portal" },
    {
      href: "/portal/notifications",
      label: t("alerts"),
      icon: BarChart3,
      match: (p: string) => p.startsWith("/portal/notifications"),
      badge: unreadCount,
    },
    {
      href: "/portal/subscription",
      label: t("billing"),
      icon: CreditCard,
      match: (p: string) => p.startsWith("/portal/subscription"),
    },
    {
      href: "#more",
      label: t("more"),
      icon: MoreHorizontal,
      match: () => moreOpen,
      onClick: () => setMoreOpen(true),
    },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/60 bg-white/85 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90 lg:hidden">
        <ul className="mx-auto flex max-w-lg justify-around px-1 pt-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.match(pathname);
            const className = cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-medium",
              active ? "text-emerald-600" : "text-zinc-500"
            );
            if (tab.onClick) {
              return (
                <li key={tab.label} className="flex-1">
                  <button type="button" className={className} onClick={tab.onClick}>
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                </li>
              );
            }
            return (
              <li key={tab.href} className="flex-1">
                <Link href={tab.href} className={className}>
                  <Icon className="h-5 w-5" />
                  {tab.label}
                  {"badge" in tab && tab.badge && tab.badge > 0 && (
                    <span className="absolute right-3 top-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("moreMenu")}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {PORTAL_MORE_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-3 text-sm dark:border-zinc-800"
                >
                  <Icon className="h-4 w-4 text-emerald-600" />
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

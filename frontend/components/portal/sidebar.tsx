"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PlusCircle,
  UserPlus,
  Bell,
  User,
  CreditCard,
  Receipt,
  Megaphone,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import {
  MOBILE_MENU_BTN,
  SIDEBAR_NAV,
  SIDEBAR_OVERLAY,
  sidebarAsideClass,
} from "@/lib/layout-classes";

const navItems = [
  { href: "/portal", labelKey: "portalDashboard", icon: LayoutDashboard, exact: true },
  { href: "/portal/create-mess", labelKey: "createMess", icon: PlusCircle },
  { href: "/portal/join-mess", labelKey: "joinMess", icon: UserPlus },
  { href: "/portal/notifications", labelKey: "notifications", icon: Bell },
  { href: "/portal/announcements", labelKey: "announcements", icon: Megaphone },
  { href: "/portal/profile", labelKey: "profile", icon: User },
  { href: "/portal/subscription", labelKey: "subscription", icon: CreditCard },
  { href: "/portal/payments", labelKey: "payments", icon: Receipt },
  { href: "/portal/settings", labelKey: "settings", icon: Settings },
  { href: "/portal/help", labelKey: "helpCenter", icon: HelpCircle },
];

export function PortalSidebar({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const pathname = usePathname();
  const { open, toggle, close } = useMobileSidebar();
  const t = useTranslations("portal");
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");

  return (
    <>
      <button
        type="button"
        className={MOBILE_MENU_BTN}
        onClick={toggle}
        aria-label={tSidebar("toggleSidebar")}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className={sidebarAsideClass(open)}>
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            BM
          </div>
          <div>
            <span className="block font-bold leading-tight">{t("brand")}</span>
            <span className="text-xs text-emerald-600">{t("subtitle")}</span>
          </div>
        </div>

        <div className="flex gap-1 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <ThemeToggle className="flex-1 justify-start" />
          <LocaleSwitcher className="flex-1 justify-start" />
        </div>

        <nav className={SIDEBAR_NAV}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span>{t(item.labelKey)}</span>
                  {item.href === "/portal/notifications" && unreadNotifications > 0 ? (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                      {unreadNotifications}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            {tCommon("logout")}
          </Button>
        </div>
      </aside>

      {open && <div className={SIDEBAR_OVERLAY} onClick={close} aria-hidden />}
    </>
  );
}

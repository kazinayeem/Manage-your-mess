"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Smartphone,
  Wallet,
  Layers,
  Ticket,
  Gift,
  LifeBuoy,
  Megaphone,
  BarChart3,
  ScrollText,
  Settings,
  Database,
  Flag,
  HardDrive,
  Plug,
  Mail,
  Bell,
  Shield,
  User,
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
  { href: "/super-admin", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/super-admin/users", labelKey: "users", icon: Users },
  { href: "/super-admin/messes", labelKey: "messes", icon: Building2 },
  { href: "/super-admin/subscriptions", labelKey: "subscriptions", icon: CreditCard },
  { href: "/super-admin/payments", labelKey: "payments", icon: Wallet },
  { href: "/super-admin/payment-methods", labelKey: "paymentMethods", icon: Smartphone },
  { href: "/super-admin/plans", labelKey: "plans", icon: Layers },
  { href: "/super-admin/coupons", labelKey: "coupons", icon: Ticket },
  { href: "/super-admin/referrals", labelKey: "referrals", icon: Gift },
  { href: "/super-admin/support", labelKey: "support", icon: LifeBuoy },
  { href: "/super-admin/announcements", labelKey: "announcements", icon: Megaphone },
  { href: "/super-admin/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/super-admin/audit-logs", labelKey: "auditLogs", icon: ScrollText },
  { href: "/super-admin/settings", labelKey: "settings", icon: Settings },
  { href: "/super-admin/database", labelKey: "database", icon: Database },
  { href: "/super-admin/feature-flags", labelKey: "featureFlags", icon: Flag },
  { href: "/super-admin/backups", labelKey: "backups", icon: HardDrive },
  { href: "/super-admin/api", labelKey: "api", icon: Plug },
  { href: "/super-admin/email-templates", labelKey: "emailTemplates", icon: Mail },
  { href: "/super-admin/notification-templates", labelKey: "notificationTemplates", icon: Bell },
  { href: "/super-admin/security", labelKey: "security", icon: Shield },
  { href: "/super-admin/profile", labelKey: "profile", icon: User },
] as const;

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { open, toggle, close } = useMobileSidebar();
  const t = useTranslations("superAdmin");
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
            BM
          </div>
          <div>
            <span className="block font-bold leading-tight">{t("brand")}</span>
            <span className="text-xs text-violet-600">{t("subtitle")}</span>
          </div>
        </div>

        <div className="flex gap-1 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <ThemeToggle className="flex-1 justify-start" />
          <LocaleSwitcher className="flex-1 justify-start" />
        </div>

        <nav className={SIDEBAR_NAV}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              "exact" in item && item.exact
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
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
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

"use client";

import { Link, usePathname } from "@/i18n/navigation";
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
  UserPlus,
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
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import {
  MOBILE_MENU_BTN,
  SIDEBAR_NAV,
  SIDEBAR_OVERLAY,
  sidebarAsideClass,
} from "@/lib/layout-classes";

const navItems = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/super-admin/users", label: "Users", icon: Users },
  { href: "/super-admin/messes", label: "Messes", icon: Building2 },
  { href: "/super-admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/super-admin/payments", label: "Payments", icon: Wallet },
  { href: "/super-admin/payment-methods", label: "Payment Methods", icon: Smartphone },
  { href: "/super-admin/plans", label: "Plans", icon: Layers },
  { href: "/super-admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/super-admin/referrals", label: "Referrals", icon: Gift },
  { href: "/super-admin/support", label: "Support Tickets", icon: LifeBuoy },
  { href: "/super-admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/super-admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/super-admin/settings", label: "System Settings", icon: Settings },
  { href: "/super-admin/database", label: "Database Monitor", icon: Database },
  { href: "/super-admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/super-admin/backups", label: "Backup Manager", icon: HardDrive },
  { href: "/super-admin/api", label: "API Management", icon: Plug },
  { href: "/super-admin/email-templates", label: "Email Templates", icon: Mail },
  { href: "/super-admin/notification-templates", label: "Notification Templates", icon: Bell },
  { href: "/super-admin/security", label: "Security Center", icon: Shield },
  { href: "/super-admin/profile", label: "Profile", icon: User },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { open, toggle, close } = useMobileSidebar();

  return (
    <>
      <button
        type="button"
        className={MOBILE_MENU_BTN}
        onClick={toggle}
        aria-label="Toggle sidebar"
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className={sidebarAsideClass(open)}>
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
            SA
          </div>
          <div>
            <span className="block font-bold leading-tight">MessFlow Pro</span>
            <span className="text-xs text-violet-600">Super Admin</span>
          </div>
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
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
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
            Logout
          </Button>
        </div>
      </aside>

      {open && <div className={SIDEBAR_OVERLAY} onClick={close} aria-hidden />}
    </>
  );
}

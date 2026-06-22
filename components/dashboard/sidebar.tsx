"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Receipt,
  Wallet,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Calendar,
  CalendarDays,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessSwitcher, type MessOption } from "@/components/mess/mess-switcher";

const navItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/deposits/add", labelKey: "addDeposit", icon: Wallet },
  { href: "/dashboard/meals/add", labelKey: "addMeal", icon: Utensils },
  { href: "/dashboard/expenses/add", labelKey: "addCost", icon: Receipt },
  { href: "/dashboard/current-month", labelKey: "currentMonth", icon: Calendar },
  { href: "/dashboard/months", labelKey: "allMonths", icon: CalendarDays },
  { href: "/dashboard/months/new", labelKey: "startNewMonth", icon: CalendarDays },
  { href: "/dashboard/members", labelKey: "members", icon: Users },
  { href: "/dashboard/members/add", labelKey: "addMember", icon: Users },
  { href: "/dashboard/settings/manager", labelKey: "changeManager", icon: UserCog, ownerOnly: true },
  { href: "/dashboard/reports", labelKey: "pdfReports", icon: FileText },
  { href: "/dashboard/settlement", labelKey: "settlement", icon: Receipt },
  { href: "/dashboard/messes", labelKey: "myMesses", icon: Users },
  { href: "/dashboard/settings", labelKey: "inviteSettings", icon: Settings },
];

export function DashboardSidebar({
  messes = [],
  activeMessId,
  memberRole,
}: {
  messes?: MessOption[];
  activeMessId?: string;
  memberRole?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const [open, setOpen] = useState(false);

  const isOwner = memberRole === "MESS_OWNER";
  const visibleNav = navItems.filter((item) => !item.ownerOnly || isOwner);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border bg-white p-2 lg:hidden dark:bg-zinc-950"
        onClick={() => setOpen(!open)}
        aria-label={tSidebar("toggleSidebar")}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            MF
          </div>
          <span className="font-bold">{t("appName")}</span>
        </div>

        <MessSwitcher messes={messes} activeMessId={activeMessId} />

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tSidebar(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  );
}

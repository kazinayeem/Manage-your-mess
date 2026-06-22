"use client";

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
  LayoutGrid,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { messPath } from "@/lib/mess-routes";
import type { MessCapabilities } from "@/lib/mess-permissions";
import type { LucideIcon } from "lucide-react";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { StartNewMonthDialog } from "@/components/mess/start-new-month-dialog";
import {
  MOBILE_MENU_BTN,
  SIDEBAR_NAV,
  SIDEBAR_OVERLAY,
  sidebarAsideClass,
} from "@/lib/layout-classes";

type NavDef = {
  segment: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
  show?: (cap: MessCapabilities, isManager: boolean) => boolean;
  dialog?: "start-month";
};

function buildNav(messId: string, cap: MessCapabilities, isManager: boolean) {
  const p = (segment: string) => messPath(messId, segment);

  const all: NavDef[] = cap.readOnly
    ? [
        { segment: "", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
        { segment: "/current-month", labelKey: "currentMonth", icon: Calendar },
        { segment: "/meals", labelKey: "myMeals", icon: Utensils },
        { segment: "/deposits", labelKey: "myDeposits", icon: Wallet },
        { segment: "/expenses", labelKey: "messCosts", icon: Receipt },
        { segment: "/bills", labelKey: "billsUtilities", icon: Zap },
        { segment: "/reports", labelKey: "reports", icon: FileText },
      ]
    : [
        { segment: "", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
        {
          segment: "/deposits/add",
          labelKey: "addDeposit",
          icon: Wallet,
          show: (c) => c.canAddDeposits,
        },
        {
          segment: "/meals/add",
          labelKey: "addMeal",
          icon: Utensils,
          show: (c) => c.canAddMeals,
        },
        {
          segment: "/expenses/add",
          labelKey: "addMealCost",
          icon: Receipt,
          show: (c) => c.canAddExpenses,
        },
        { segment: "/bills", labelKey: "billsUtilities", icon: Zap },
        {
          segment: "/bills/add",
          labelKey: "addBill",
          icon: Zap,
          show: (c) => c.canManageBills,
        },
        { segment: "/current-month", labelKey: "currentMonth", icon: Calendar },
        { segment: "/months", labelKey: "allMonths", icon: CalendarDays },
        {
          segment: "/months/new",
          labelKey: "startNewMonth",
          icon: CalendarDays,
          show: (c) => c.canStartMonth,
          dialog: "start-month",
        },
        {
          segment: "/members",
          labelKey: "members",
          icon: Users,
          show: (c) => c.canViewMembers || c.canManageMembers,
        },
        {
          segment: "/members/add",
          labelKey: "addMember",
          icon: Users,
          show: (_c, mgr) => mgr,
        },
        {
          segment: "/settings/manager",
          labelKey: "changeManager",
          icon: UserCog,
          show: (c) => c.canChangeManager,
        },
        {
          segment: "/reports",
          labelKey: "pdfReports",
          icon: FileText,
          show: (c) => c.canGenerateReports,
        },
        {
          segment: "/settlement",
          labelKey: "settlement",
          icon: Receipt,
          show: (c) => c.canGenerateReports,
        },
        {
          segment: "/settings",
          labelKey: "inviteSettings",
          icon: Settings,
          show: (c) => c.canManageSettings,
        },
      ];

  return all
    .filter((item) => !item.show || item.show(cap, isManager))
    .map((item) => ({
      href: p(item.segment),
      labelKey: item.labelKey,
      icon: item.icon,
      exact: item.exact,
      dialog: item.dialog,
    }));
}

export function MessWorkspaceSidebar({
  messId,
  messName,
  capabilities,
  readOnly,
  isManager,
}: {
  messId: string;
  messName: string;
  capabilities: MessCapabilities;
  readOnly: boolean;
  isManager: boolean;
}) {
  const pathname = usePathname();
  const { open, toggle, close } = useMobileSidebar();
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const tWorkspace = useTranslations("workspace");
  const navItems = buildNav(messId, capabilities, isManager);

  return (
    <>
      <button
        type="button"
        className={MOBILE_MENU_BTN}
        onClick={toggle}
        aria-label={t("toggleSidebar")}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className={sidebarAsideClass(open)}>
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            MF
          </div>
          <div className="min-w-0">
            <span className="block truncate font-bold">{messName}</span>
            {readOnly && <span className="text-xs text-sky-600">{tWorkspace("readOnly")}</span>}
          </div>
        </div>

        <nav className={SIDEBAR_NAV}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const linkClass = cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            );

            if (item.dialog === "start-month") {
              return (
                <StartNewMonthDialog
                  key={item.href}
                  messId={messId}
                  onOpenChange={(isOpen) => !isOpen && close()}
                >
                  <button type="button" className={linkClass}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(item.labelKey)}
                  </button>
                </StartNewMonthDialog>
              );
            }

            return (
              <Link key={item.href} href={item.href} onClick={close} className={linkClass}>
                <Icon className="h-4 w-4 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
          <Link
            href="/portal"
            onClick={close}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <LayoutGrid className="h-4 w-4" />
            {t("portalHome")}
          </Link>
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

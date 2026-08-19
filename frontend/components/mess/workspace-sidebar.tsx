"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buildMessNavGroups } from "@/lib/mess-navigation";
import type { MessCapabilities } from "@/lib/mess-permissions";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { StartNewMonthDialog } from "@/components/mess/start-new-month-dialog";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  MOBILE_MENU_BTN,
  SIDEBAR_NAV,
  SIDEBAR_OVERLAY,
  sidebarAsideClass,
} from "@/lib/layout-classes";
import { useUIStore } from "@/stores";

export function MessWorkspaceSidebar({
  messId,
  messName,
  capabilities,
  readOnly,
  isManager,
  isOwner,
}: {
  messId: string;
  messName: string;
  capabilities: MessCapabilities;
  readOnly: boolean;
  isManager: boolean;
  isOwner: boolean;
}) {
  const pathname = usePathname();
  const { open, toggle, close } = useMobileSidebar();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const tWorkspace = useTranslations("workspace");
  const groups = buildMessNavGroups(messId, capabilities, isManager, isOwner);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, true]))
  );

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

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

      <aside
        data-collapsed={sidebarCollapsed ? true : undefined}
        className={cn(
          "peer relative overflow-hidden",
          sidebarAsideClass(open),
          sidebarCollapsed && "lg:w-[4.5rem]",
          !sidebarCollapsed && "lg:w-72"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 border-b border-zinc-200/80 dark:border-zinc-800",
            sidebarCollapsed
              ? "flex-col items-center gap-2 px-2 py-3"
              : "h-16 items-center gap-3 px-4"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm">
            BM
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{messName}</span>
              {readOnly && (
                <span className="text-[10px] font-medium text-sky-600">{tWorkspace("readOnly")}</span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className={cn(
              "hidden rounded-lg text-zinc-500 hover:bg-zinc-100 lg:inline-flex dark:hover:bg-zinc-800",
              sidebarCollapsed
                ? "h-9 w-9 items-center justify-center"
                : "p-1.5"
            )}
            aria-label={sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")}
            title={sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <div
          className={cn(
            "flex gap-1 border-b border-zinc-200/80 px-3 py-2 dark:border-zinc-800",
            sidebarCollapsed && "justify-center px-2"
          )}
        >
          <ThemeToggle
            className={cn("justify-start", sidebarCollapsed ? "w-9 justify-center px-0" : "flex-1")}
            showLabel={!sidebarCollapsed}
          />
          {!sidebarCollapsed && <LocaleSwitcher className="flex-1 justify-start" />}
        </div>

        <nav className={SIDEBAR_NAV}>
          {groups.map((group) => {
            const expanded = openGroups[group.id] !== false;
            return (
              <div key={group.id} className="mb-2">
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {t(group.labelKey)}
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                    />
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {(expanded || sidebarCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = item.exact
                          ? pathname === item.href
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const linkClass = cn(
                          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                          sidebarCollapsed && "justify-center px-2"
                        );

                        const inner = (
                          <>
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                                active && "text-emerald-600 dark:text-emerald-400"
                              )}
                            />
                            {!sidebarCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
                          </>
                        );

                        if (item.dialog === "start-month") {
                          return (
                            <StartNewMonthDialog
                              key={item.href}
                              messId={messId}
                              onOpenChange={(isOpen) => !isOpen && close()}
                            >
                              <button type="button" className={linkClass} title={t(item.labelKey)}>
                                {inner}
                              </button>
                            </StartNewMonthDialog>
                          );
                        }

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            className={linkClass}
                            title={sidebarCollapsed ? t(item.labelKey) : undefined}
                          >
                            {inner}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <Link
            href="/portal"
            onClick={close}
            className={cn(
              "mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
              sidebarCollapsed && "justify-center"
            )}
            title={sidebarCollapsed ? t("portalHome") : undefined}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && t("portalHome")}
          </Link>
        </nav>

        <div className="shrink-0 border-t border-zinc-200/80 p-3 dark:border-zinc-800">
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3", sidebarCollapsed && "justify-center px-2")}
            onClick={() => signOut({ callbackUrl: "/" })}
            title={sidebarCollapsed ? tCommon("logout") : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && tCommon("logout")}
          </Button>
        </div>
      </aside>

      {open && <div className={SIDEBAR_OVERLAY} onClick={close} aria-hidden />}
    </>
  );
}

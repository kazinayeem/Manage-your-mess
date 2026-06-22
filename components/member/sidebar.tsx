"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Utensils,
  Wallet,
  Receipt,
  FileText,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessSwitcher, type MessOption } from "@/components/mess/mess-switcher";

const navItems = [
  { href: "/member", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/member/meals", label: "My Meals", icon: Utensils },
  { href: "/member/deposits", label: "My Deposits", icon: Wallet },
  { href: "/member/expenses", label: "Mess Costs", icon: Receipt },
  { href: "/member/reports", label: "Reports", icon: FileText },
  { href: "/member/profile", label: "Profile", icon: User },
];

export function MemberSidebar({
  messes = [],
  activeMessId,
}: {
  messes?: MessOption[];
  activeMessId?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border bg-white p-2 lg:hidden dark:bg-zinc-950"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full transition-transform"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-sm font-bold text-white">
            MB
          </div>
          <div>
            <span className="block font-bold leading-tight">MessFlow</span>
            <span className="text-xs text-sky-600">Member Portal</span>
          </div>
        </div>

        {messes.length > 1 && (
          <MessSwitcher messes={messes} activeMessId={activeMessId} />
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
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
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
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

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  );
}

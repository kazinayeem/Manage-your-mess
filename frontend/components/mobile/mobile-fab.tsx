"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, Utensils, Receipt, X, ShoppingCart, Zap } from "lucide-react";
import { messPath } from "@/lib/mess-routes";
import { cn } from "@/lib/utils";
import type { MessCapabilities } from "@/lib/mess-permissions";

export function MobileFab({
  messId,
  canWrite = true,
  capabilities,
}: {
  messId: string;
  canWrite?: boolean;
  capabilities?: MessCapabilities;
}) {
  const t = useTranslations("quickActions");
  const [open, setOpen] = useState(false);

  if (!canWrite) return null;

  const actions = [
    capabilities?.canAddDeposits !== false && {
      href: messPath(messId, "/deposits/add"),
      label: t("addDeposit"),
      icon: Wallet,
    },
    capabilities?.canAddMeals !== false && {
      href: messPath(messId, "/meals/add"),
      label: t("addMeal"),
      icon: Utensils,
    },
    capabilities?.canAddExpenses !== false && {
      href: messPath(messId, "/expenses/add"),
      label: t("addMealCost"),
      icon: Receipt,
    },
    capabilities?.canManageBazaar && {
      href: messPath(messId, "/bazaar/new"),
      label: t("addBazaar"),
      icon: ShoppingCart,
    },
    capabilities?.canManageBills && {
      href: messPath(messId, "/bills/add"),
      label: t("addBill"),
      icon: Zap,
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Wallet }[];

  if (actions.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-50 lg:hidden">
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
              aria-label="Close"
            />
            <motion.ul
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="mb-3 space-y-2"
            >
              {actions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.li
                    key={a.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={a.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/95 py-2.5 pl-3 pr-4 text-sm font-medium shadow-lg backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                        <Icon className="h-4 w-4" />
                      </span>
                      {a.label}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/35 ring-4 ring-white/80 dark:ring-zinc-950/80",
          open && "rotate-0"
        )}
        aria-expanded={open}
        aria-label={open ? t("closeQuickActions") : t("openQuickActions")}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.span>
      </motion.button>
    </div>
  );
}

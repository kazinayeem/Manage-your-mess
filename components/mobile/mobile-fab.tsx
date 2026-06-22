"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, Utensils, Receipt, X } from "lucide-react";
import { messPath } from "@/lib/mess-routes";
import { cn } from "@/lib/utils";

export function MobileFab({
  messId,
  canWrite = true,
}: {
  messId: string;
  canWrite?: boolean;
}) {
  const t = useTranslations("quickActions");
  const [open, setOpen] = useState(false);

  if (!canWrite) return null;

  const actions = [
    { href: messPath(messId, "/deposits/add"), label: t("addDeposit"), icon: Wallet },
    { href: messPath(messId, "/meals/add"), label: t("addMeal"), icon: Utensils },
    { href: messPath(messId, "/expenses/add"), label: t("addMealCost"), icon: Receipt },
  ];

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 z-50 lg:hidden">
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-3 space-y-2"
          >
            {actions.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.li
                  key={a.href}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-2 pl-3 pr-4 text-sm font-medium shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <Icon className="h-4 w-4 text-emerald-600" />
                    {a.label}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-95",
          open && "rotate-0"
        )}
        aria-expanded={open}
        aria-label={open ? "Close quick actions" : "Quick actions"}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}

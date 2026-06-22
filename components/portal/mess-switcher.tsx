"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, Link } from "@/i18n/navigation";
import { Building2, ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import { formatMessDisplayRole } from "@/lib/mess-permissions";
import type { UserRole } from "@prisma/client";
import { switchActiveMess } from "@/actions/mess";
import { toast } from "sonner";

export type NavbarMessOption = {
  messId: string;
  name: string;
  role: UserRole | string;
  isOwner?: boolean;
  isManager?: boolean;
};

export function PortalMessSwitcher({
  messes,
  activeMessId,
}: {
  messes: NavbarMessOption[];
  activeMessId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = messes.find((m) => m.messId === activeMessId) ?? messes[0];

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    setMenuStyle({
      top: rect.bottom + 6,
      left,
      width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  if (!messes.length) return null;

  async function openMess(messId: string) {
    setOpen(false);
    if (messId === activeMessId) return;
    const result = await switchActiveMess(messId);
    if (!result.success) {
      toast.error("error" in result ? result.error : "Could not switch mess");
      return;
    }
    router.push(messPath(messId));
    router.refresh();
  }

  const menu =
    open && menuStyle
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] touch-manipulation"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              className="fixed z-[210] max-h-[min(70dvh,24rem)] overflow-y-auto overscroll-contain rounded-lg border border-zinc-200 bg-white py-1 shadow-lg [-webkit-overflow-scrolling:touch] dark:border-zinc-700 dark:bg-zinc-900"
              style={{
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
              }}
            >
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Your Messes
              </p>
              {messes.map((m) => (
                <button
                  key={m.messId}
                  type="button"
                  onClick={() => openMess(m.messId)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800",
                    m.messId === activeMessId && "bg-emerald-50 dark:bg-emerald-950"
                  )}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatMessDisplayRole(m.role as UserRole, {
                        isLegalOwner: m.isOwner && !m.isManager,
                        isActiveManager: m.isManager,
                      })}
                    </p>
                  </div>
                </button>
              ))}
              <div className="border-t border-zinc-200 dark:border-zinc-700">
                <Link
                  href="/portal"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <LayoutGrid className="h-4 w-4" />
                  All Messes (Portal)
                </Link>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) updatePosition();
          setOpen(!open);
        }}
        className={cn(
          "flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium touch-manipulation",
          "hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        )}
      >
        <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="max-w-[min(160px,40vw)] truncate">{active?.name ?? "Select Mess"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition", open && "rotate-180")} />
      </button>
      {menu}
    </div>
  );
}

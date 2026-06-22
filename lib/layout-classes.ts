import { cn } from "@/lib/utils";

/** Fixed hamburger — safe-area aware for notched iPhones in Safari. */
export const MOBILE_MENU_BTN =
  "fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-50 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm touch-manipulation lg:hidden dark:border-zinc-800 dark:bg-zinc-950";

export function sidebarAsideClass(open: boolean) {
  return cn(
    /* inset-y-0 is more reliable than h-dvh on Safari iOS */
    "fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] flex-col border-r border-zinc-200 bg-white",
    "transition-transform duration-300 ease-in-out",
    "dark:border-zinc-800 dark:bg-zinc-950 lg:translate-x-0",
    open ? "translate-x-0" : "-translate-x-full"
  );
}

export const SIDEBAR_NAV =
  "min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-3 [-webkit-overflow-scrolling:touch]";

export const SIDEBAR_OVERLAY =
  "fixed inset-0 z-30 bg-black/50 touch-manipulation lg:hidden";

export const SHELL_BG = "flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950";

export const MAIN_WITH_SIDEBAR = "flex min-h-0 min-w-0 flex-1 flex-col overflow-visible lg:pl-64";

/** Top padding when there is no sticky header (room for hamburger). */
export const MAIN_CONTENT_PAD =
  "min-w-0 px-4 py-8 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] lg:px-8 lg:pt-8";

/** Sticky top bar — solid bg; overflow-visible so dropdowns aren't clipped in Safari. */
export const STICKY_TOPBAR =
  "sticky top-0 z-30 overflow-visible border-b border-zinc-200 bg-white pt-[env(safe-area-inset-top,0px)] dark:border-zinc-800 dark:bg-zinc-950";

/** Inner row: left padding clears the fixed menu button on mobile. */
export const STICKY_TOPBAR_INNER =
  "flex min-h-14 min-w-0 items-center justify-between gap-3 px-4 py-2 pl-14 lg:px-8 lg:pl-8";

/** Bottom padding when mobile tab bar is visible */
export const MOBILE_BOTTOM_PAD = "pb-mobile-nav lg:pb-0";

/** Main content with mobile nav clearance */
export const MAIN_CONTENT_MOBILE =
  "min-w-0 px-4 py-6 pb-mobile-nav lg:px-8 lg:py-8";

"use client";

import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  className,
}: {
  content: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 w-max max-w-[220px] -translate-x-1/2 scale-95 rounded-lg border border-zinc-200/80 bg-zinc-900 px-2.5 py-1.5 text-[11px] leading-snug text-white opacity-0 shadow-xl transition-all duration-200 group-hover/tip:scale-100 group-hover/tip:opacity-100 dark:border-zinc-700"
      >
        {content}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
      </span>
    </span>
  );
}

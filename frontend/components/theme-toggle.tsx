"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const CYCLE = ["light", "dark", "system"] as const;

export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted && theme ? theme : "light";
  const label =
    current === "system" ? t("system") : current === "dark" ? t("dark") : t("light");

  function cycleTheme() {
    const idx = CYCLE.indexOf(current as (typeof CYCLE)[number]);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  }

  const Icon =
    current === "system" ? Monitor : current === "dark" ? Moon : Sun;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className={cn("gap-1.5", className)}
      aria-label={t("cycleTheme")}
      title={t("cycleTheme")}
      disabled={!mounted}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          current === "dark" && "text-indigo-400",
          current === "light" && "text-amber-500",
          current === "system" && "text-zinc-500"
        )}
      />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );
}

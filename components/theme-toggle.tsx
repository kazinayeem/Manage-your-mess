"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = (mounted ? resolvedTheme ?? theme : "light") === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("gap-1.5", className)}
        aria-label={t("light")}
        disabled
      >
        <Sun className="h-4 w-4 opacity-50" />
        {showLabel && <span className="text-xs font-medium">{t("light")}</span>}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn("gap-1.5", className)}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      title={isDark ? t("switchToLight") : t("switchToDark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">{isDark ? t("light") : t("dark")}</span>
      )}
    </Button>
  );
}

"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { updateUserLocale } from "@/actions/profile";

const LOCALE_OPTIONS = [
  { code: "en" as const, label: "English", native: "English" },
  { code: "bn" as const, label: "Bengali", native: "বাংলা" },
];

export function PortalSettingsView() {
  const t = useTranslations("portalSettings");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeLanguage(next: "en" | "bn") {
    if (next === locale || pending) return;

    startTransition(async () => {
      const result = await updateUserLocale(next);
      if (!result.success) {
        toast.error("error" in result ? result.error : t("saveFailed"));
        return;
      }
      router.replace(pathname, { locale: next });
      router.refresh();
      toast.success(t("languageSaved"));
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-emerald-600" />
            {t("languageTitle")}
          </CardTitle>
          <CardDescription>{t("languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {LOCALE_OPTIONS.filter((o) => routing.locales.includes(o.code)).map((option) => {
              const active = locale === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  disabled={pending}
                  onClick={() => changeLanguage(option.code)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors touch-manipulation",
                    active
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 dark:bg-emerald-950/40"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  )}
                >
                  <div>
                    <p className="font-semibold">{option.native}</p>
                    <p className="text-sm text-zinc-500">{option.label}</p>
                  </div>
                  {active && <Check className="h-5 w-5 shrink-0 text-emerald-600" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-zinc-400">{t("languageHint")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("moreTitle")}</CardTitle>
          <CardDescription>{t("moreDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-500">{t("comingSoon")}</CardContent>
      </Card>
    </div>
  );
}

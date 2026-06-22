"use client";

import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateUserLocale } from "@/actions/profile";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const next = locale === "bn" ? "en" : "bn";

    startTransition(async () => {
      if (session?.user) {
        await updateUserLocale(next);
      }
      router.replace(pathname, { locale: next });
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={pending}
      className={className}
      aria-label={locale === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{locale === "bn" ? "EN" : "বাংলা"}</span>
    </Button>
  );
}

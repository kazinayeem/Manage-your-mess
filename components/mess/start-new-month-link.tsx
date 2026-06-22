"use client";

import { StartNewMonthDialog } from "@/components/mess/start-new-month-dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function StartNewMonthLink({ messId }: { messId: string }) {
  const t = useTranslations("messMonth");

  return (
    <StartNewMonthDialog messId={messId}>
      <Button variant="link" className="h-auto p-0 text-emerald-600">
        {t("startLink")} →
      </Button>
    </StartNewMonthDialog>
  );
}

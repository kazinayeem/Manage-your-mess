"use client";

import { StartNewMonthDialog } from "@/components/mess/start-new-month-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function StartNewMonthClient({ messId }: { messId?: string }) {
  const t = useTranslations("messMonth");

  if (!messId) return null;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-500">{t("description")}</p>
        <StartNewMonthDialog messId={messId}>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">{t("openModal")}</Button>
        </StartNewMonthDialog>
      </CardContent>
    </Card>
  );
}

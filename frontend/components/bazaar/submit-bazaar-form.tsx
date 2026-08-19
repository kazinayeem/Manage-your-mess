"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitBazaarTask, markBazaarInProgress } from "@/actions/bazaar";
import { toast } from "sonner";
import type { BazaarItemStatus } from "@prisma/client";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number | null;
  status: BazaarItemStatus;
};

const ITEM_STATUSES: BazaarItemStatus[] = [
  "PURCHASED",
  "PARTIALLY_PURCHASED",
  "NOT_AVAILABLE",
  "SUBSTITUTED",
];

export function SubmitBazaarForm({
  messId,
  taskId,
  items,
  expectedBudget,
  canSubmit,
}: {
  messId: string;
  taskId: string;
  items: Item[];
  expectedBudget: number;
  canSubmit: boolean;
}) {
  const t = useTranslations("bazaar");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [itemStates, setItemStates] = useState(
    items.map((i) => ({
      id: i.id,
      status: i.status === "PENDING" ? ("PURCHASED" as BazaarItemStatus) : i.status,
      actualPrice: i.estimatedPrice?.toString() ?? "",
      notes: "",
    }))
  );

  if (!canSubmit) return null;

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  }

  async function handleStart() {
    await markBazaarInProgress(messId, taskId);
    toast.success(t("started"));
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const updates = itemStates.map((s) => ({
      id: s.id,
      status: s.status,
      actualPrice: s.actualPrice ? Number(s.actualPrice) : undefined,
      notes: s.notes || undefined,
    }));
    form.set("itemUpdates", JSON.stringify(updates));
    const result = await submitBazaarTask(messId, taskId, form);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(t("submitted"));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("submitShopping")}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={handleStart}>
          {t("markInProgress")}
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="actualCost">{t("actualCost")}</Label>
            <Input id="actualCost" name="actualCost" type="number" min="0" step="0.01" required className="mt-1" />
            <p className="mt-1 text-xs text-zinc-500">
              {t("budget")}: {expectedBudget} BDT
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("itemStatus")}</Label>
            {items.map((item, i) => (
              <div key={item.id} className="rounded-lg border p-3 text-sm dark:border-zinc-800">
                <p className="font-medium">
                  {item.name} — {item.quantity} {item.unit}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Select
                    value={itemStates[i].status}
                    onValueChange={(v) =>
                      setItemStates((prev) =>
                        prev.map((row, idx) => (idx === i ? { ...row, status: v as BazaarItemStatus } : row))
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`itemStatus_${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={t("actualPrice")}
                    type="number"
                    value={itemStates[i].actualPrice}
                    onChange={(e) =>
                      setItemStates((prev) =>
                        prev.map((row, idx) => (idx === i ? { ...row, actualPrice: e.target.value } : row))
                      )
                    }
                  />
                  <Input
                    placeholder={t("notes")}
                    value={itemStates[i].notes}
                    onChange={(e) =>
                      setItemStates((prev) =>
                        prev.map((row, idx) => (idx === i ? { ...row, notes: e.target.value } : row))
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="missingItems">{t("missingItems")}</Label>
            <Textarea id="missingItems" name="missingItems" className="mt-1" rows={2} />
          </div>
          <div>
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" name="notes" className="mt-1" rows={2} />
          </div>

          <div>
            <Label htmlFor="receipts">{t("uploadReceipts")}</Label>
            <Input
              id="receipts"
              name="receipts"
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="mt-1"
              onChange={handleFiles}
            />
            {previews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded border">
                    {src.endsWith(".pdf") ? (
                      <span className="flex h-full items-center justify-center text-xs">PDF</span>
                    ) : (
                      <Image src={src} alt="" fill className="object-cover" unoptimized />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submitForReview")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

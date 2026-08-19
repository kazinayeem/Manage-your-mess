"use client";

import { useState } from "react";
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
import { reviewBazaarTask } from "@/actions/bazaar";
import { toast } from "sonner";

export function ReviewBazaarForm({
  messId,
  taskId,
  actualCost,
  expectedBudget,
}: {
  messId: string;
  taskId: string;
  actualCost: number;
  expectedBudget: number;
}) {
  const t = useTranslations("bazaar");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED" | "CORRECTION_REQUESTED">("APPROVED");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    form.set("status", status);
    const result = await reviewBazaarTask(messId, taskId, form);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(t("reviewDone"));
    router.refresh();
  }

  const diff = actualCost - expectedBudget;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("managerReview")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900">
            <p className="text-zinc-500">{t("budget")}</p>
            <p className="font-semibold">{expectedBudget} BDT</p>
          </div>
          <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900">
            <p className="text-zinc-500">{t("actual")}</p>
            <p className="font-semibold">{actualCost} BDT</p>
          </div>
          <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900">
            <p className="text-zinc-500">{t("difference")}</p>
            <p className={`font-semibold ${diff > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {diff > 0 ? "+" : ""}
              {diff} BDT
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("decision")}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">{t("approve")}</SelectItem>
                <SelectItem value="REJECTED">{t("reject")}</SelectItem>
                <SelectItem value="CORRECTION_REQUESTED">{t("requestCorrection")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === "APPROVED" && (
            <div>
              <Label htmlFor="rewardPoints">{t("rewardPoints")}</Label>
              <Input
                id="rewardPoints"
                name="rewardPoints"
                type="number"
                min="0"
                placeholder="20"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-zinc-500">{t("rewardHint")}</p>
            </div>
          )}
          <div>
            <Label htmlFor="comment">{t("comment")}</Label>
            <Textarea id="comment" name="comment" className="mt-1" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("processing") : t("submitReview")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

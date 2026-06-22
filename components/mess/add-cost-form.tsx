"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { addMealCost } from "@/actions/mess";
import { messPath } from "@/lib/mess-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function AddMealCostForm({
  messId,
  members,
  defaultDate,
}: {
  messId: string;
  members: { id: string; fullName: string | null }[];
  defaultDate: string;
}) {
  const t = useTranslations("messCost");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creditShopper, setCreditShopper] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (creditShopper) {
      formData.set("creditShopper", "on");
    }
    const result = await addMealCost(messId, formData);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(
      creditShopper ? t("successWithDeposit") : t("success")
    );
    router.push(messPath(messId));
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-lg border-zinc-200 shadow-sm">
      <CardContent className="p-6">
        <h2 className="mb-6 text-center text-xl font-bold text-rose-600">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="date">{t("date")}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={defaultDate}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="amount">{t("amount")}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder={t("amountPlaceholder")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bazarList">{t("bazarList")}</Label>
            <textarea
              id="bazarList"
              name="bazarList"
              rows={3}
              placeholder={t("bazarPlaceholder")}
              className="mt-1 flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <div>
            <Label htmlFor="shopperIds">{t("shoppers")}</Label>
            <select
              id="shopperIds"
              name="shopperIds"
              multiple
              className="mt-1 min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName ?? "Unnamed"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">{t("shoppersHint")}</p>
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <input
              type="checkbox"
              name="creditShopper"
              checked={creditShopper}
              onChange={(e) => setCreditShopper(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm leading-snug">{t("creditShopper")}</span>
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 py-6 text-base font-semibold hover:bg-rose-700"
          >
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
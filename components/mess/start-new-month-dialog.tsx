"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getNewMonthPreview, startNewMonth } from "@/actions/monthly";
import { messPath } from "@/lib/mess-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type StartNewMonthDialogProps = {
  messId: string;
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

export function StartNewMonthDialog({ messId, children, onOpenChange }: StartNewMonthDialogProps) {
  const t = useTranslations("messMonth");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [monthName, setMonthName] = useState("");
  const [currentLabel, setCurrentLabel] = useState("");

  useEffect(() => {
    if (!open) return;

    setFetching(true);
    getNewMonthPreview(messId)
      .then((preview) => {
        if (!preview) {
          toast.error(t("noActiveMonth"));
          setOpen(false);
          return;
        }
        setCurrentLabel(preview.currentLabel);
        setMonthName(preview.suggestedLabel);
      })
      .catch(() => toast.error(t("loadFailed")))
      .finally(() => setFetching(false));
  }, [open, messId, t]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setMonthName("");
      setCurrentLabel("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = monthName.trim();
    if (trimmed.length < 2) {
      toast.error(t("nameTooShort"));
      return;
    }

    setLoading(true);
    const result = await startNewMonth(messId, trimmed);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(t("success"));
    handleOpenChange(false);
    router.push(messPath(messId));
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {fetching ? (
              <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("loading")}
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm dark:border-amber-900 dark:bg-amber-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    {t("closingMonth")}
                  </p>
                  <p className="mt-1 font-semibold text-amber-950 dark:text-amber-100">
                    {currentLabel || "—"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="monthName">{t("newMonthName")}</Label>
                  <Input
                    id="monthName"
                    value={monthName}
                    onChange={(e) => setMonthName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    className="mt-1.5"
                    required
                    minLength={2}
                    maxLength={100}
                    autoFocus
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">{t("nameHint")}</p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || fetching || !monthName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

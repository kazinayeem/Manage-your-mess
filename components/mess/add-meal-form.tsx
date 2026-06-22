"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { addMealEntry } from "@/actions/mess";
import { messPath } from "@/lib/mess-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Utensils, Users } from "lucide-react";
import type { MealPortion } from "@/lib/validations";

const PORTIONS: { value: MealPortion; labelKey: string }[] = [
  { value: "0", labelKey: "none" },
  { value: "0.5", labelKey: "half" },
  { value: "1", labelKey: "full" },
];

type MemberPortions = {
  breakfast: MealPortion;
  lunch: MealPortion;
  dinner: MealPortion;
};

const DEFAULT_PORTIONS: MemberPortions = {
  breakfast: "0",
  lunch: "0",
  dinner: "0",
};

function PortionSelect({
  label,
  value,
  onChange,
  labels,
}: {
  label: string;
  value: MealPortion;
  onChange: (value: MealPortion) => void;
  labels: Record<string, string>;
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-zinc-500">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MealPortion)}
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        {PORTIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {labels[p.labelKey]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AddMealForm({
  messId,
  members,
  defaultDate,
}: {
  messId: string;
  members: { id: string; fullName: string | null }[];
  defaultDate: string;
}) {
  const t = useTranslations("messMeal");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [portions, setPortions] = useState<Record<string, MemberPortions>>({});

  const labels = useMemo(
    () => ({
      none: t("portionNone"),
      half: t("portionHalf"),
      full: t("portionFull"),
    }),
    [t]
  );

  const selectedMembers = useMemo(
    () => members.filter((m) => selected.has(m.id)),
    [members, selected]
  );

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setPortions((p) => {
          const copy = { ...p };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
        setPortions((p) => ({ ...p, [id]: p[id] ?? { ...DEFAULT_PORTIONS } }));
      }
      return next;
    });
  }

  function selectAll() {
    const all = new Set(members.map((m) => m.id));
    setSelected(all);
    setPortions((prev) => {
      const next = { ...prev };
      for (const m of members) {
        if (!next[m.id]) next[m.id] = { ...DEFAULT_PORTIONS };
      }
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
    setPortions({});
  }

  function updatePortion(
    memberId: string,
    meal: keyof MemberPortions,
    value: MealPortion
  ) {
    setPortions((prev) => ({
      ...prev,
      [memberId]: { ...(prev[memberId] ?? DEFAULT_PORTIONS), [meal]: value },
    }));
  }

  function applyFirstToAll() {
    if (selectedMembers.length < 2) return;
    const first = portions[selectedMembers[0].id] ?? DEFAULT_PORTIONS;
    setPortions((prev) => {
      const next = { ...prev };
      for (const m of selectedMembers) {
        next[m.id] = { ...first };
      }
      return next;
    });
    toast.success(t("appliedToAll"));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected.size) {
      toast.error(t("selectMemberError"));
      return;
    }

    const entries = selectedMembers.map((m) => {
      const p = portions[m.id] ?? DEFAULT_PORTIONS;
      return {
        memberId: m.id,
        breakfast: p.breakfast,
        lunch: p.lunch,
        dinner: p.dinner,
      };
    });

    const hasMeal = entries.some(
      (e) =>
        parseFloat(e.breakfast) + parseFloat(e.lunch) + parseFloat(e.dinner) > 0
    );
    if (!hasMeal) {
      toast.error(t("selectMealError"));
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("entries", JSON.stringify(entries));

    const result = await addMealEntry(messId, formData);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(t("success", { count: result.data?.count ?? selected.size }));
    router.push(messPath(messId));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <Card className="mx-auto max-w-lg border-zinc-200 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-2 text-emerald-700">
            <Utensils className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("title")}</h2>
          </div>

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
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {t("members")}
                </Label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-emerald-600 hover:underline"
                  >
                    {t("selectAll")}
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-zinc-500 hover:underline"
                  >
                    {t("clearAll")}
                  </button>
                </div>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                {members.length === 0 ? (
                  <p className="p-2 text-sm text-zinc-500">{t("noMembers")}</p>
                ) : (
                  members.map((m) => (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => toggleMember(m.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                      />
                      <span className="text-sm">{m.fullName ?? "Unnamed"}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {t("selectedCount", { count: selected.size })}
              </p>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">{t("perMemberMeals")}</Label>
                  {selectedMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={applyFirstToAll}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      {t("applyFirstToAll")}
                    </button>
                  )}
                </div>

                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {selectedMembers.map((m) => {
                    const p = portions[m.id] ?? DEFAULT_PORTIONS;
                    return (
                      <div
                        key={m.id}
                        className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                      >
                        <p className="mb-2 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {m.fullName ?? "Unnamed"}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <PortionSelect
                            label={t("breakfast")}
                            value={p.breakfast}
                            onChange={(v) => updatePortion(m.id, "breakfast", v)}
                            labels={labels}
                          />
                          <PortionSelect
                            label={t("lunch")}
                            value={p.lunch}
                            onChange={(v) => updatePortion(m.id, "lunch", v)}
                            labels={labels}
                          />
                          <PortionSelect
                            label={t("dinner")}
                            value={p.dinner}
                            onChange={(v) => updatePortion(m.id, "dinner", v)}
                            labels={labels}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-zinc-500">{t("halfMealHint")}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || members.length === 0 || selected.size === 0}
              className="w-full bg-emerald-600 py-6 text-base font-semibold hover:bg-emerald-700"
            >
              {loading ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

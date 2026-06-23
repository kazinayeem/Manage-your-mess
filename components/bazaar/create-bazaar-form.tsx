"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
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
import { createBazaarTask } from "@/actions/bazaar";
import { toast } from "sonner";
import { messPath } from "@/lib/mess-routes";
import { bazaarTaskPath } from "@/lib/bazaar-routes";

type Member = { id: string; fullName: string | null };
type ItemRow = { name: string; quantity: string; unit: string; estimatedPrice: string };

const UNITS = ["KG", "Liter", "Packet", "Piece", "Dozen", "Gram", "Other"];

export function CreateBazaarForm({
  messId,
  members,
  defaultDate,
}: {
  messId: string;
  members: Member[];
  defaultDate: string;
}) {
  const t = useTranslations("bazaar");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState("MEDIUM");
  const [memberId, setMemberId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { name: "", quantity: "", unit: "KG", estimatedPrice: "" },
  ]);

  function addItem() {
    setItems((prev) => [...prev, { name: "", quantity: "", unit: "KG", estimatedPrice: "" }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const parsedItems = items
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        quantity: Number(r.quantity) || 0,
        unit: r.unit,
        estimatedPrice: r.estimatedPrice ? Number(r.estimatedPrice) : undefined,
      }));

    if (parsedItems.length === 0 || !memberId) {
      toast.error(memberId ? t("addOneItem") : t("selectMember"));
      setLoading(false);
      return;
    }

    form.set("items", JSON.stringify(parsedItems));
    form.set("priority", priority);
    form.set("memberId", memberId);
    const result = await createBazaarTask(messId, form);

    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(t("taskCreated"));
    router.push(bazaarTaskPath(messId, result.data?.taskId ?? ""));
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("createTask")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">{t("taskTitle")}</Label>
            <Input id="title" name="title" required className="mt-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="shoppingDate">{t("shoppingDate")}</Label>
              <Input id="shoppingDate" name="shoppingDate" type="date" defaultValue={defaultDate} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="expectedBudget">{t("expectedBudget")}</Label>
              <Input id="expectedBudget" name="expectedBudget" type="number" min="0" step="0.01" required className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="priority">{t("priority")}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{t("priorityLow")}</SelectItem>
                <SelectItem value="MEDIUM">{t("priorityMedium")}</SelectItem>
                <SelectItem value="HIGH">{t("priorityHigh")}</SelectItem>
                <SelectItem value="URGENT">{t("priorityUrgent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea id="description" name="description" className="mt-1" rows={2} />
          </div>
          <div>
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" name="notes" className="mt-1" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("shoppingItems")}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-4 w-4" />
            {t("addItem")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((row, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <Input
                  placeholder={t("itemName")}
                  value={row.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  placeholder={t("quantity")}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Select value={row.unit} onValueChange={(v) => updateItem(i, "unit", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Input
                  placeholder={t("estimatedPrice")}
                  type="number"
                  min="0"
                  value={row.estimatedPrice}
                  onChange={(e) => updateItem(i, "estimatedPrice", e.target.value)}
                />
              </div>
              <div className="flex sm:col-span-1 sm:justify-end">
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("assignMember")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="memberId">{t("memberName")}</Label>
            <Select value={memberId} onValueChange={setMemberId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("selectMember")} />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName ?? "Member"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="assignmentDate">{t("assignmentDate")}</Label>
              <Input id="assignmentDate" name="assignmentDate" type="date" defaultValue={defaultDate} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="expectedCompletionDate">{t("dueDate")}</Label>
              <Input id="expectedCompletionDate" name="expectedCompletionDate" type="date" defaultValue={defaultDate} required className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("creating") : t("createAndAssign")}
      </Button>
    </form>
  );
}

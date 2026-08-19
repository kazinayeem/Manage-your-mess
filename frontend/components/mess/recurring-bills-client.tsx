"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { addRecurringBill, generateRecurringBills } from "@/actions/bills";
import { BILL_CATEGORIES } from "@/lib/bills/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { getBillCategoryLabel } from "@/lib/bills/categories";
import type { RecurringBill } from "@prisma/client";

export function RecurringBillsClient({
  messId,
  recurring,
}: {
  messId: string;
  recurring: RecurringBill[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await addRecurringBill(messId, new FormData(e.currentTarget));
    setLoading(false);
    if (!result.success) {
      toast.error("error" in result ? result.error : "Failed");
      return;
    }
    toast.success("Recurring bill added");
    router.refresh();
  }

  async function handleGenerate() {
    const result = await generateRecurringBills(messId);
    if (!result.success) {
      toast.error("error" in result ? result.error : "Failed");
      return;
    }
    toast.success(`Generated ${result.data?.count ?? 0} bill(s)`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={handleGenerate}>
          Generate Due Bills Now
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">Add Recurring Bill</h2>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <select name="category" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                {BILL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" required className="mt-1" />
            </div>
            <div>
              <Label>Day of Month</Label>
              <Input name="dayOfMonth" type="number" min="1" max="28" defaultValue={1} className="mt-1" />
            </div>
            <div>
              <Label>Reminder Days Before</Label>
              <Input name="reminderDays" type="number" min="0" max="14" defaultValue={3} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Input name="description" className="mt-1" />
            </div>
            <Button type="submit" disabled={loading}>Add Recurring</Button>
          </form>
        </CardContent>
      </Card>

      {recurring.length > 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Day</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recurring.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{getBillCategoryLabel(r.category)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(r.amount)}</td>
                  <td className="px-3 py-2">{r.dayOfMonth}</td>
                  <td className="px-3 py-2">{r.isActive ? "Active" : "Paused"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

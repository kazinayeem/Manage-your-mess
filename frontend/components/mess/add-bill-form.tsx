"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { addBill } from "@/actions/bills";
import { messPath } from "@/lib/mess-routes";
import { BILL_CATEGORIES } from "@/lib/bills/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { BillSplitMethod } from "@prisma/client";

type MemberOption = { id: string; fullName: string | null; roomNumber?: string | null };

export function AddBillForm({
  messId,
  members,
  defaultBillingMonth,
}: {
  messId: string;
  members: MemberOption[];
  defaultBillingMonth: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [splitMethod, setSplitMethod] = useState<BillSplitMethod>("EQUAL");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("splitMethod", splitMethod);

    if (splitMethod === "CUSTOM") {
      const splits = members
        .map((m) => ({
          memberId: m.id,
          amount: parseFloat(customSplits[m.id] || "0"),
        }))
        .filter((s) => s.amount > 0);
      fd.set("customSplits", JSON.stringify(splits));
    }

    const result = await addBill(messId, fd);
    setLoading(false);

    if (!result.success) {
      toast.error("error" in result ? result.error : "Failed to save bill");
      return;
    }

    toast.success("Bill saved and split among members");
    router.push(messPath(messId, "/bills"));
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Bill Type</Label>
              <select
                id="category"
                name="category"
                required
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {BILL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount (BDT)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="billingMonth">Billing Month</Label>
              <Input
                id="billingMonth"
                name="billingMonth"
                type="date"
                defaultValue={defaultBillingMonth}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" name="dueDate" type="date" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="paidDate">Paid Date</Label>
              <Input id="paidDate" name="paidDate" type="date" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div>
              <Label htmlFor="paidByMemberId">Paid By</Label>
              <select
                id="paidByMemberId"
                name="paidByMemberId"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">— Mess / External —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName ?? "Unnamed"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="splitMethod">Split Method</Label>
              <select
                id="splitMethod"
                value={splitMethod}
                onChange={(e) => setSplitMethod(e.target.value as BillSplitMethod)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="EQUAL">Equal Split</option>
                <option value="ROOM_BASED">Room Based Split</option>
                <option value="CUSTOM">Custom Split</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" className="mt-1" placeholder="Optional notes" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="invoiceUrl">Invoice URL</Label>
              <Input id="invoiceUrl" name="invoiceUrl" type="url" className="mt-1" placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="receiptUrl">Receipt URL</Label>
              <Input id="receiptUrl" name="receiptUrl" type="url" className="mt-1" placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="attachmentUrl">Attachment URL</Label>
              <Input id="attachmentUrl" name="attachmentUrl" type="url" className="mt-1" placeholder="https://..." />
            </div>
          </div>

          {splitMethod === "CUSTOM" && (
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-3 text-sm font-medium">Custom amounts (remaining splits equally)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {members.map((m) => (
                  <div key={m.id}>
                    <Label className="text-xs text-zinc-500">
                      {m.fullName ?? "Unnamed"}
                      {m.roomNumber ? ` · Room ${m.roomNumber}` : ""}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customSplits[m.id] ?? ""}
                      onChange={(e) =>
                        setCustomSplits((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Bill"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

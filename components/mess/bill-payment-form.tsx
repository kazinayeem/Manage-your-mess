"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { recordBillPayment } from "@/actions/bills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function BillPaymentForm({
  messId,
  billId,
  members,
}: {
  messId: string;
  billId: string;
  members: { id: string; fullName: string | null }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("billId", billId);
    const result = await recordBillPayment(messId, fd);
    setLoading(false);
    if (!result.success) {
      toast.error("error" in result ? result.error : "Payment failed");
      return;
    }
    toast.success("Payment recorded");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-4 font-semibold">Record Payment</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="memberId">Member (optional)</Label>
            <select
              id="memberId"
              name="memberId"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">General payment</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName ?? "Unnamed"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <Input id="method" name="method" placeholder="Cash, bKash…" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Input id="note" name="note" className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Record Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAddDepositMutation } from "@/lib/store/api/mess-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/mess/mess-form";
import { toast } from "sonner";
import { messPath } from "@/lib/mess-routes";

const methods = ["BKASH", "NAGAD", "ROCKET", "UPAY", "BANK_TRANSFER", "CASH"];

export function AddDepositForm({
  messId,
  members,
}: {
  messId: string;
  members: { id: string; fullName: string | null }[];
}) {
  const router = useRouter();
  const [addDeposit] = useAddDepositMutation();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const memberId = String(fd.get("memberId") || "");
    const amount = Number(fd.get("amount") || 0);
    const method = String(fd.get("method") || "CASH");
    const reference = String(fd.get("reference") || "");
    const notes = String(fd.get("notes") || "");

    try {
      await addDeposit({
        messId,
        body: { memberId, amount, method, reference: reference || undefined, notes: notes || undefined },
      }).unwrap();
      toast.success("Deposit recorded");
      router.push(messPath(messId));
      router.refresh();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add deposit");
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Record Deposit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Member" name="memberId" required>
            <select
              name="memberId"
              required
              className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName ?? "Unnamed"}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Amount (BDT)" name="amount" type="number" required />
          <FormField label="Method" name="method" required>
            <select name="method" required className="flex h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              {methods.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
            </select>
          </FormField>
          <FormField label="Reference" name="reference" />
          <FormField label="Notes" name="notes" />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Add Deposit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { addDeposit } from "@/actions/mess";
import { MessForm, FormField } from "@/components/mess/mess-form";

const methods = ["BKASH", "NAGAD", "ROCKET", "UPAY", "BANK_TRANSFER", "CASH"];

export function AddDepositForm({
  messId,
  members,
}: {
  messId: string;
  members: { id: string; fullName: string | null }[];
}) {
  return (
    <MessForm messId={messId} title="Record Deposit" submitLabel="Add Deposit" onSubmit={addDeposit}>
      <FormField label="Member" name="memberId" required>
        <select
          name="memberId"
          required
          className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        >
          <option value="">Select member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.fullName}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Amount (BDT)" name="amount" type="number" required />
      <FormField label="Method" name="method" required>
        <select name="method" required className="flex h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm">
          {methods.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
        </select>
      </FormField>
      <FormField label="Reference" name="reference" />
      <FormField label="Notes" name="notes" />
    </MessForm>
  );
}

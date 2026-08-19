"use client";

import { addMember } from "@/actions/mess";
import { MessForm, FormField } from "@/components/mess/mess-form";

export function AddMemberForm({ messId }: { messId: string }) {
  return (
    <MessForm messId={messId} title="New Member" submitLabel="Add Member" onSubmit={addMember}>
      <FormField label="Full Name" name="fullName" required />
      <FormField label="Phone" name="phone" />
      <FormField label="Monthly Deposit (BDT)" name="monthlyDeposit" type="number" defaultValue={0} />
    </MessForm>
  );
}

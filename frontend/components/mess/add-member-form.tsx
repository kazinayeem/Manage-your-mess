"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAddMemberMutation } from "@/lib/store/api/mess-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/mess/mess-form";
import { toast } from "sonner";
import { messPath } from "@/lib/mess-routes";

export function AddMemberForm({ messId }: { messId: string }) {
  const router = useRouter();
  const [addMember] = useAddMemberMutation();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") || "");
    const phone = String(fd.get("phone") || "");
    const monthlyDeposit = Number(fd.get("monthlyDeposit") || 0);

    try {
      await addMember({
        messId,
        body: { fullName, phone: phone || undefined, monthlyDeposit },
      }).unwrap();
      toast.success("Member added");
      router.push(messPath(messId, "/members"));
      router.refresh();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add member");
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>New Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name" name="fullName" required />
          <FormField label="Phone" name="phone" />
          <FormField label="Monthly Deposit (BDT)" name="monthlyDeposit" type="number" defaultValue={0} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Add Member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

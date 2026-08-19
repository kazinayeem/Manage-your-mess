"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { changeManager } from "@/actions/mess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ChangeManagerForm({
  messId,
  members,
}: {
  messId: string;
  members: { id: string; fullName: string | null; role: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    const result = await changeManager(messId, selected);
    if (!result.success) toast.error(result.error);
    else {
      toast.success("Manager updated. Previous manager now has view-only access.");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader><CardTitle>Change Manager</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-500">
          Only the current manager can assign a new manager. The previous manager becomes a
          view-only member — including the mess creator if they transfer the role.
        </p>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
        >
          <option value="">Select member as manager</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.role})
            </option>
          ))}
        </select>
        <Button className="w-full" onClick={handleSubmit} disabled={loading || !selected}>
          {loading ? "Updating..." : "Assign Manager"}
        </Button>
      </CardContent>
    </Card>
  );
}

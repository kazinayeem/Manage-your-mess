"use client";

import { useRouter } from "@/i18n/navigation";
import { suspendMess, deleteMessAdmin } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type MessRow = {
  id: string;
  name: string;
  owner: { name: string | null; email: string };
  manager: { name: string | null; email: string } | null;
  subscription: { status: string; plan: { name: string } } | null;
  _count: { members: number };
};

export function MessesManager({ messes }: { messes: MessRow[] }) {
  const router = useRouter();

  return (
    <div className="grid gap-3">
      {messes.map((m) => (
        <Card key={m.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{m.name}</CardTitle>
              <Badge variant="outline">
                {m.subscription?.status ?? "No sub"} · {m.subscription?.plan.name ?? "—"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Owner: {m.owner.name ?? m.owner.email}</p>
            <p>Manager: {m.manager?.name ?? m.manager?.email ?? "—"}</p>
            <p>{m._count.members} active members</p>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const r = await suspendMess(m.id, "Suspended by super admin");
                  if (r.success) {
                    toast.success("Mess subscription suspended");
                    router.refresh();
                  } else toast.error(r.error);
                }}
              >
                Suspend
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  if (!confirm(`Delete mess "${m.name}"?`)) return;
                  const r = await deleteMessAdmin(m.id);
                  if (r.success) {
                    toast.success("Mess deleted");
                    router.refresh();
                  } else toast.error(r.error);
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

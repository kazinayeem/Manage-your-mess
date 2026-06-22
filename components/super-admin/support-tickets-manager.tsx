"use client";

import { useRouter } from "@/i18n/navigation";
import { updateSupportTicket } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { TicketStatus } from "@prisma/client";

type TicketRow = {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  createdAt: Date;
  user: { name: string | null; email: string };
};

export function SupportTicketsManager({ tickets }: { tickets: TicketRow[] }) {
  const router = useRouter();

  return (
    <div className="grid gap-3">
      {tickets.length === 0 && <p className="text-sm text-zinc-500">No support tickets.</p>}
      {tickets.map((t) => (
        <Card key={t.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{t.subject}</CardTitle>
              <Badge>{t.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-zinc-500">{t.user.name ?? t.user.email}</p>
            <p>{t.description}</p>
            <div className="flex gap-2 pt-2">
              {(["IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatus[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const r = await updateSupportTicket(t.id, { status: s });
                    if (r.success) {
                      toast.success(`Marked ${s}`);
                      router.refresh();
                    } else toast.error(r.error);
                  }}
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import {
  useGetAdminSupportTicketsQuery,
  useUpdateSupportTicketMutation,
} from "@/lib/store/api/super-admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { TicketStatus } from "@/types/domain";

export function SupportTicketsManager() {
  const { data, isLoading, error } = useGetAdminSupportTicketsQuery();
  const [updateTicket] = useUpdateSupportTicketMutation();
  const tickets = data?.data || data || [];

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading support tickets from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading support tickets</div>;
  }

  return (
    <div className="grid gap-3">
      {(!Array.isArray(tickets) || tickets.length === 0) && (
        <p className="text-sm text-zinc-500">No support tickets.</p>
      )}
      {Array.isArray(tickets) && tickets.map((t: any) => (
        <Card key={t.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{t.subject}</CardTitle>
              <Badge>{t.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-zinc-500">{t.user?.name ?? t.user?.email ?? "User"}</p>
            <p>{t.description}</p>
            <div className="flex gap-2 pt-2">
              {(["IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatus[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await updateTicket({ ticketId: t.id, data: { status: s } }).unwrap();
                      toast.success(`Marked ${s}`);
                    } catch (err: any) {
                      toast.error(err?.data?.message || "Update failed");
                    }
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

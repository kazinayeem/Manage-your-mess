"use client";

import { useMemo, useState, useTransition } from "react";
import { markAnnouncementRead } from "@/actions/announcements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AnnouncementItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  isRead: boolean;
  publishedAt: Date | null;
};

const priorityStyles: Record<string, string> = {
  LOW: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  MEDIUM: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  CRITICAL: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
};

export function GlobalAnnouncementCenter({
  announcements,
}: {
  announcements: AnnouncementItem[];
}) {
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = announcements.filter((item) => !dismissed.includes(item.id));
  const critical = useMemo(
    () => visible.find((item) => item.priority === "CRITICAL" && !item.isRead),
    [visible]
  );

  if (!visible.length) return null;

  function markRead(id: string) {
    startTransition(async () => {
      const result = await markAnnouncementRead(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDismissed((current) => [...current, id]);
    });
  }

  return (
    <>
      <div className="space-y-2 px-4 pt-4 lg:px-8">
        {visible.slice(0, 2).map((announcement) => (
          <div
            key={announcement.id}
            className={cn(
              "flex flex-wrap items-start justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm",
              priorityStyles[announcement.priority] ?? priorityStyles.MEDIUM
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{announcement.title}</p>
                <Badge variant="outline" className="border-current/30 bg-transparent">
                  {announcement.priority}
                </Badge>
                {!announcement.isRead && <Badge>New</Badge>}
              </div>
              <p className="mt-1 text-sm opacity-90">{announcement.description}</p>
            </div>
            {!announcement.isRead && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => markRead(announcement.id)}
                className="border-current/30 bg-transparent"
              >
                Mark as read
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={Boolean(critical)} onOpenChange={(open) => !open && critical && markRead(critical.id)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{critical?.title}</DialogTitle>
            <DialogDescription>{critical?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => critical && markRead(critical.id)} disabled={pending}>
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

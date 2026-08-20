"use client";

import { useRouter } from "@/i18n/navigation";
import {
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/lib/store/api/notification-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  if (!notifications.length) {
    return <p className="text-sm text-zinc-500">No notifications yet.</p>;
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await markAllRead().unwrap();
              toast.success("All marked as read");
              router.refresh();
            } catch (e) {
              toast.error("Failed to mark all as read");
            }
          }}
        >
          Mark all as read ({unread})
        </Button>
      )}
      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={n.isRead ? "opacity-75" : ""}>
            <CardContent className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {!n.isRead && <Badge variant="default">New</Badge>}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{n.message}</p>
                <p className="mt-1 text-xs text-zinc-400">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await markRead({ id: n.id }).unwrap();
                      router.refresh();
                    } catch (e) {
                      toast.error("Failed to mark notification read");
                    }
                  }}
                >
                  Mark read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

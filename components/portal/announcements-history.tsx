"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markAnnouncementRead } from "@/actions/announcements";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";

type AnnouncementRow = Awaited<ReturnType<typeof import("@/actions/announcements").getUserAnnouncements>>[number];

export function AnnouncementsHistory({ announcements }: { announcements: AnnouncementRow[] }) {
  const router = useRouter();

  if (!announcements.length) {
    return <p className="text-sm text-zinc-500">No announcements available yet.</p>;
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{announcement.title}</CardTitle>
              <p className="text-sm text-zinc-500">{announcement.type} · {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleString() : "Draft"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{announcement.priority}</Badge>
              {!announcement.isRead && <Badge>New</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{announcement.description}</p>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
              <span>
                Active: {announcement.startsAt ? new Date(announcement.startsAt).toLocaleDateString() : "Immediate"} -{" "}
                {announcement.endsAt ? new Date(announcement.endsAt).toLocaleDateString() : "Until removed"}
              </span>
              {!announcement.isRead && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const result = await markAnnouncementRead(announcement.id);
                    if (!result.success) return toast.error(result.error);
                    router.refresh();
                  }}
                >
                  Mark as Read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

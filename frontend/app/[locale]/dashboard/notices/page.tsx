import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function NoticesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await apiGet("/announcements/user");
  const notices = res?.data || res || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notice Board</h1>
      <div className="space-y-4">
        {(Array.isArray(notices) ? notices : []).map((notice: any) => (
          <Card key={notice.id} className={notice.isPinned ? "border-emerald-500" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{notice.title}</CardTitle>
                <div className="flex gap-2">
                  {notice.isPinned && <Badge>Pinned</Badge>}
                  {notice.priority === "URGENT" && <Badge variant="destructive">Urgent</Badge>}
                </div>
              </div>
              <p className="text-xs text-zinc-500">{formatDate(notice.createdAt)}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{notice.description || notice.content}</p>
            </CardContent>
          </Card>
        ))}
        {(!Array.isArray(notices) || notices.length === 0) && (
          <Card><CardContent className="py-12 text-center text-zinc-500">No notices yet</CardContent></Card>
        )}
      </div>
    </div>
  );
}

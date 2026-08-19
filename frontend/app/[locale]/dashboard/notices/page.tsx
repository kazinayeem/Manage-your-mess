import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function NoticesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const notices = await db.notice.findMany({
    where: { messId: messes[0].messId, deletedAt: null },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notice Board</h1>
      <div className="space-y-4">
        {notices.map((notice) => (
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
              <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: notice.content }} />
            </CardContent>
          </Card>
        ))}
        {notices.length === 0 && (
          <Card><CardContent className="py-12 text-center text-zinc-500">No notices yet</CardContent></Card>
        )}
      </div>
    </div>
  );
}

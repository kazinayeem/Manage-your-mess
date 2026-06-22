import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function VisitorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const visitors = await db.visitor.findMany({
    where: { messId: messes[0].messId, deletedAt: null },
    orderBy: { entryAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visitor Management</h1>
      <div className="space-y-3">
        {visitors.map((v) => (
          <Card key={v.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-sm text-zinc-500">{v.purpose ?? "—"} · {v.phone ?? "No phone"}</p>
                <p className="text-xs text-zinc-400">Entry: {formatDate(v.entryAt)}</p>
              </div>
              <Badge variant={v.exitAt ? "secondary" : "success"}>
                {v.exitAt ? "Exited" : "Inside"}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {visitors.length === 0 && (
          <Card><CardContent className="py-12 text-center text-zinc-500">No visitors logged</CardContent></Card>
        )}
      </div>
    </div>
  );
}

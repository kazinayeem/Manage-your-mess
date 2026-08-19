import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const tasks = await db.task.findMany({
    where: { messId: messes[0].messId, deletedAt: null },
    include: { assignee: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <Badge>{task.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-500">
              <p>Type: {task.type}</p>
              {task.assignee && <p>Assigned: {task.assignee.name}</p>}
              {task.dueDate && <p>Due: {formatDate(task.dueDate)}</p>}
              <div className="h-2 rounded-full bg-zinc-100">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${task.progress}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

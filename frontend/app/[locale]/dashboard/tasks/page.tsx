import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await apiGet("/bazaar/tasks");
  const tasks = res?.data || res || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Array.isArray(tasks) ? tasks : []).map((task: any) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <Badge>{task.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-500">
              {task.assignment && <p>Assigned: {task.assignment.member?.fullName}</p>}
              {task.shoppingDate && <p>Due: {formatDate(task.shoppingDate)}</p>}
            </CardContent>
          </Card>
        ))}
        {(!Array.isArray(tasks) || tasks.length === 0) && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-zinc-500">No tasks found</CardContent></Card>
        )}
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type LogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
  mess: { name: string } | null;
};

export function AuditLogsList({ logs }: { logs: LogRow[] }) {
  if (!logs.length) {
    return <p className="text-sm text-zinc-500">No audit logs yet.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div>
              <p className="font-medium">
                {log.action} · {log.entity}
                {log.entityId && <span className="text-zinc-400"> #{log.entityId.slice(0, 8)}</span>}
              </p>
              <p className="text-zinc-500">
                {log.user?.name ?? log.user?.email ?? "System"}
                {log.mess && ` · ${log.mess.name}`}
              </p>
            </div>
            <Badge variant="secondary">{formatDate(log.createdAt)}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

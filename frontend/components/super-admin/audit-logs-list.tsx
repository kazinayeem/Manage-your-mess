"use client";

import { useGetAdminAuditLogsQuery } from "@/lib/store/api/super-admin-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function AuditLogsList() {
  const { data, isLoading, error } = useGetAdminAuditLogsQuery();
  const logs = data?.data || data || [];

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading audit logs from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading audit logs</div>;
  }

  if (!Array.isArray(logs) || !logs.length) {
    return <p className="text-sm text-zinc-500">No audit logs yet.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log: any) => (
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

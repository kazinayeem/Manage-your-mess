"use client";

import { useGetSecurityOverviewQuery } from "@/lib/store/api/super-admin-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function SuperAdminSecurityPage() {
  const { data, isLoading, error } = useGetSecurityOverviewQuery();
  const res = data?.data || data || {};
  const logs = res.recentEvents || res.logs || (Array.isArray(res) ? res : []);

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading security logs from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading security overview</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Center</h1>
        <p className="text-zinc-500">Login attempts and security events.</p>
      </div>
      <div className="space-y-2">
        {(!Array.isArray(logs) || logs.length === 0) && (
          <p className="text-sm text-zinc-500">No security events logged.</p>
        )}
        {Array.isArray(logs) && logs.map((log: any) => (
          <Card key={log.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium">{log.action || log.event || "Security Log"}</p>
                <p className="text-zinc-500">{log.user?.email ?? log.email ?? "Unknown user"}</p>
                {log.ipAddress && <p className="text-xs text-zinc-400">IP: {log.ipAddress}</p>}
              </div>
              <Badge variant="secondary">{formatDate(log.createdAt || new Date())}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

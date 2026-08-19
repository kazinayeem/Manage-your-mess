import { getSecurityLogs } from "@/actions/super-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function SuperAdminSecurityPage() {
  const logs = await getSecurityLogs(150);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Center</h1>
        <p className="text-zinc-500">Login attempts and security events.</p>
      </div>
      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-zinc-500">{log.user?.email ?? "Unknown user"}</p>
                {log.ipAddress && <p className="text-xs text-zinc-400">IP: {log.ipAddress}</p>}
              </div>
              <Badge variant="secondary">{formatDate(log.createdAt)}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { getAdminAuditLogs } from "@/actions/super-admin";
import { AuditLogsList } from "@/components/super-admin/audit-logs-list";

export default async function SuperAdminAuditLogsPage() {
  const logs = await getAdminAuditLogs(200);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-zinc-500">Platform activity trail for compliance and debugging.</p>
      </div>
      <AuditLogsList logs={logs} />
    </div>
  );
}

import type { AuditAction } from "@/types/domain";

export async function logBillingAudit(input: {
  userId?: string | null;
  messId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldData?: unknown;
  newData?: unknown;
}) {
  // Billing audit logs handled by Express backend controllers
}

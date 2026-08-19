import { db } from "@/lib/db";
import type { AuditAction } from "@prisma/client";

export async function logBillingAudit(input: {
  userId?: string | null;
  messId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldData?: unknown;
  newData?: unknown;
}) {
  await db.auditLog.create({
    data: {
      userId: input.userId ?? null,
      messId: input.messId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      oldData: input.oldData ? JSON.stringify(input.oldData) : null,
      newData: input.newData ? JSON.stringify(input.newData) : null,
    },
  });
}

import type { AuditAction } from "@prisma/client";
import { prisma } from "../config/database";

export async function logAudit(input: {
  userId?: string | null;
  messId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldData?: unknown;
  newData?: unknown;
}) {
  await prisma.auditLog.create({
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
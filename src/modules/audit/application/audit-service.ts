import { type AuditSeverity, type Prisma } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";

type RecordAuditEventInput = {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  severity?: AuditSeverity;
  payload?: Prisma.InputJsonValue;
};

export async function recordAuditEvent(input: RecordAuditEventInput) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      severity: input.severity,
      payload: input.payload,
    },
  });
}
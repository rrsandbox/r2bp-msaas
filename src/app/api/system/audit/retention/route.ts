import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEventSafe, runAuditRetention } from "@/modules/audit/application/audit-service";

type RetentionPayload = {
  retentionDays?: number;
  dryRun?: boolean;
  tenantId?: string;
};

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.system.audit.retention.run",
      requestId,
    },
    async () => {
      const context = await requireAuth("task:read");

      if (context.role !== "SUPER_ADMIN") {
        throw new AppError("Apenas o super usuario do sistema pode executar retencao de auditoria.", ErrorCodes.RBAC_FORBIDDEN, 403);
      }

      const payload = (await request.json()) as RetentionPayload;
      const retentionDays = Number(payload.retentionDays ?? 180);
      const dryRun = Boolean(payload.dryRun);
      const tenantId = payload.tenantId?.trim() || undefined;

      const result = await runAuditRetention({
        retentionDays,
        dryRun,
        tenantId,
      });

      await recordAuditEventSafe({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "AUDIT_RETENTION_EXECUTED",
        resource: "audit_log",
        severity: "WARNING",
        payload: {
          retentionDays: result.retentionDays,
          dryRun: result.dryRun,
          targetTenantId: result.tenantId,
          eligibleCount: result.eligibleCount,
          deletedCount: result.deletedCount,
          cutoff: result.cutoff.toISOString(),
        },
      });

      return successResponse({ result }, 200, requestId);
    },
  );
}

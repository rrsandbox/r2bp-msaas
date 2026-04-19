import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { deleteTenant, updateTenant } from "@/modules/tenant/application/tenant-service";

type RouteParams = {
  params: Promise<{ tenantId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.update",
      requestId,
    },
    async () => {
      const context = await requireAuth("tenant:update");
      const { tenantId } = await params;
      const payload = await request.json();
      const tenant = await updateTenant(tenantId, payload, {
        role: context.role,
        tenantId: context.tenantId,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "TENANT_UPDATED",
        resource: "tenant",
        payload: {
          tenantId,
        },
      });

      return successResponse({ tenant }, 200, requestId);
    },
  );
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.delete",
      requestId,
    },
    async () => {
      const context = await requireAuth("tenant:update");
      const { tenantId } = await params;
      await deleteTenant(tenantId, {
        role: context.role,
        tenantId: context.tenantId,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "TENANT_DELETED",
        resource: "tenant",
        payload: {
          tenantId,
        },
        severity: "CRITICAL",
      });

      return successResponse({ deleted: true }, 200, requestId);
    },
  );
}
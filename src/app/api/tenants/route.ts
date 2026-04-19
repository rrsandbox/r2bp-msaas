import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { createTenant, listTenants } from "@/modules/tenant/application/tenant-service";

export async function GET() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.list",
      requestId,
    },
    async () => {
      const context = await requireAuth("tenant:read");
      const items = await listTenants({
        role: context.role,
        tenantId: context.tenantId,
      });

      return successResponse({ items }, 200, requestId);
    },
  );
}

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.create",
      requestId,
    },
    async () => {
      const context = await requireAuth("tenant:update");
      const payload = await request.json();
      const tenant = await createTenant(payload);

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "TENANT_CREATED",
        resource: "tenant",
        payload: {
          createdTenantId: tenant.id,
          createdTenantSlug: tenant.slug,
        },
      });

      return successResponse({ tenant }, 201, requestId);
    },
  );
}
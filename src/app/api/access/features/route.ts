import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { createAccessFeature, listAccessFeatures } from "@/modules/access/application/access-service";

export async function GET() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.access.features.list",
      requestId,
    },
    async () => {
      const context = await requireAuth("access:read");
      const items = await listAccessFeatures({
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
      operation: "api.access.features.create",
      requestId,
    },
    async () => {
      const context = await requireAuth("access:write");
      const payload = await request.json();
      const feature = await createAccessFeature(payload, {
        role: context.role,
        tenantId: context.tenantId,
      });

      await recordAuditEvent({
        tenantId: feature.tenantId,
        userId: context.userId,
        action: "ACCESS_FEATURE_CREATED",
        resource: "access_feature",
        payload: {
          featureId: feature.id,
          key: feature.key,
          name: feature.name,
        },
      });

      return successResponse({ feature }, 201, requestId);
    },
  );
}

import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import {
  deleteUserFeaturePermission,
  listUserFeaturePermissions,
  setUserFeaturePermission,
} from "@/modules/access/application/access-service";

export async function GET() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.access.permissions.list",
      requestId,
    },
    async () => {
      const context = await requireAuth("access:read");
      const items = await listUserFeaturePermissions({
        role: context.role,
        tenantId: context.tenantId,
      });

      return successResponse({ items }, 200, requestId);
    },
  );
}

export async function PUT(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.access.permissions.upsert",
      requestId,
    },
    async () => {
      const context = await requireAuth("access:write");
      const payload = await request.json();
      const permission = await setUserFeaturePermission(payload, {
        role: context.role,
        tenantId: context.tenantId,
      });

      await recordAuditEvent({
        tenantId: permission.tenantId,
        userId: context.userId,
        action: "ACCESS_PERMISSION_UPDATED",
        resource: "access_permission",
        payload: {
          permissionId: permission.id,
          userId: permission.userId,
          featureId: permission.featureId,
          canAccess: permission.canAccess,
        },
      });

      return successResponse({ permission }, 200, requestId);
    },
  );
}

export async function DELETE(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.access.permissions.delete",
      requestId,
    },
    async () => {
      const context = await requireAuth("access:write");
      const payload = await request.json();
      const permissionId = String(payload?.permissionId ?? "").trim();

      const permission = await deleteUserFeaturePermission(permissionId, {
        role: context.role,
        tenantId: context.tenantId,
      });

      await recordAuditEvent({
        tenantId: permission.tenantId,
        userId: context.userId,
        action: "ACCESS_PERMISSION_DELETED",
        resource: "access_permission",
        payload: {
          permissionId: permission.id,
          userId: permission.userId,
          featureId: permission.featureId,
        },
        severity: "CRITICAL",
      });

      return successResponse({ deleted: true, permissionId: permission.id }, 200, requestId);
    },
  );
}

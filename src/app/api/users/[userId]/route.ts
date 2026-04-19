import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { deleteUser, updateUser } from "@/modules/user/application/user-service";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.users.update",
      requestId,
    },
    async () => {
      const context = await requireAuth("user:update");
      const { userId } = await params;
      const payload = await request.json();
      const user = await updateUser(userId, payload, {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "USER_UPDATED",
        resource: "user",
        payload: {
          userId,
        },
      });

      return successResponse({ user }, 200, requestId);
    },
  );
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.users.delete",
      requestId,
    },
    async () => {
      const context = await requireAuth("user:update");
      const { userId } = await params;

      await deleteUser(userId, {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "USER_DELETED",
        resource: "user",
        payload: {
          userId,
        },
        severity: "CRITICAL",
      });

      return successResponse({ deleted: true }, 200, requestId);
    },
  );
}
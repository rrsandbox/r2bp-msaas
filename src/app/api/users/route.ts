import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { createUser, listUsers } from "@/modules/user/application/user-service";

export async function GET() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.users.list",
      requestId,
    },
    async () => {
      const context = await requireAuth("user:read");
      const items = await listUsers({
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
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
      operation: "api.users.create",
      requestId,
    },
    async () => {
      const context = await requireAuth("user:create");
      const payload = await request.json();
      const user = await createUser(payload, {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "USER_CREATED",
        resource: "user",
        payload: {
          createdUserId: user.userId,
          createdUserEmail: user.email,
        },
      });

      return successResponse({ user }, 201, requestId);
    },
  );
}
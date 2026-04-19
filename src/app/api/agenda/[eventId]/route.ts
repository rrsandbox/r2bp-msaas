import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { deleteAgendaEvent, updateAgendaEvent } from "@/modules/agenda/application/agenda-service";

type RouteParams = {
  params: Promise<{ eventId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.agenda.update",
      requestId,
    },
    async () => {
      const context = await requireAuth("agenda:write");
      const { eventId } = await params;
      const payload = await request.json();

      const event = await updateAgendaEvent(eventId, payload, {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      });

      await recordAuditEvent({
        tenantId: event.tenantId,
        userId: context.userId,
        action: "AGENDA_EVENT_UPDATED",
        resource: "agenda",
        payload: {
          eventId,
        },
      });

      return successResponse({ event }, 200, requestId);
    },
  );
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.agenda.delete",
      requestId,
    },
    async () => {
      const context = await requireAuth("agenda:write");
      const { eventId } = await params;

      await deleteAgendaEvent(eventId, {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "AGENDA_EVENT_DELETED",
        resource: "agenda",
        payload: {
          eventId,
        },
        severity: "CRITICAL",
      });

      return successResponse({ deleted: true }, 200, requestId);
    },
  );
}


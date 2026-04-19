import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { createAgendaEvent, listAgendaEvents } from "@/modules/agenda/application/agenda-service";

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.agenda.list",
      requestId,
    },
    async () => {
      const context = await requireAuth("agenda:read");
      const url = new URL(request.url);
      const startsFrom = url.searchParams.get("startsFrom");
      const startsTo = url.searchParams.get("startsTo");
      const ownerQuery = url.searchParams.get("ownerQuery") ?? undefined;
      const ownerId = url.searchParams.get("ownerId") ?? undefined;
      const query = url.searchParams.get("query") ?? undefined;
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
      const startsAtSort = url.searchParams.get("startsAtSort") === "desc" ? "desc" : "asc";

      const startsFromDate = startsFrom ? new Date(`${startsFrom}T00:00:00.000`) : undefined;
      const startsToDate = startsTo ? new Date(`${startsTo}T23:59:59.999`) : undefined;

      const result = await listAgendaEvents({
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      }, {
        startsFrom: startsFromDate,
        startsTo: startsToDate,
        ownerQuery,
        ownerId,
        query,
      }, {
        page,
        pageSize,
      }, {
        startsAt: startsAtSort,
      });

      return successResponse(result, 200, requestId);
    },
  );
}

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.agenda.create",
      requestId,
    },
    async () => {
      const context = await requireAuth("agenda:write");
      const payload = await request.json();
      const event = await createAgendaEvent(payload, {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      });

      await recordAuditEvent({
        tenantId: event.tenantId,
        userId: context.userId,
        action: "AGENDA_EVENT_CREATED",
        resource: "agenda",
        payload: {
          eventId: event.id,
          ownerId: event.ownerId,
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt.toISOString(),
        },
      });

      return successResponse({ event }, 201, requestId);
    },
  );
}

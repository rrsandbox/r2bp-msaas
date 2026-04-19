import { type AuditSeverity } from "@prisma/client";
import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { listAuditEvents, summarizeAuditEvents } from "@/modules/audit/application/audit-service";

function parsePositiveInteger(raw: string | null, fallback: number, max: number) {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.trunc(parsed), max);
}

function parseDate(raw: string | null) {
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseSeverity(raw: string | null): AuditSeverity | undefined {
  if (!raw) return undefined;
  if (raw === "INFO" || raw === "WARNING" || raw === "CRITICAL") return raw;
  return undefined;
}

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.audit.logs.list",
      requestId,
    },
    async () => {
      const context = await requireAuth("audit:read");
      const url = new URL(request.url);

      const page = parsePositiveInteger(url.searchParams.get("page"), 1, 10000);
      const pageSize = parsePositiveInteger(url.searchParams.get("pageSize"), 20, 100);
      const from = parseDate(url.searchParams.get("from"));
      const to = parseDate(url.searchParams.get("to"));
      const action = (url.searchParams.get("action") ?? "").trim() || undefined;
      const resource = (url.searchParams.get("resource") ?? "").trim() || undefined;
      const userId = (url.searchParams.get("userId") ?? "").trim() || undefined;
      const severity = parseSeverity(url.searchParams.get("severity"));

      const [logs, summary] = await Promise.all([
        listAuditEvents({
          tenantId: context.tenantId,
          page,
          pageSize,
          from,
          to,
          action,
          resource,
          userId,
          severity,
        }),
        summarizeAuditEvents({
          tenantId: context.tenantId,
          from,
          to,
        }),
      ]);

      return successResponse(
        {
          logs,
          summary,
          filters: {
            page,
            pageSize,
            from: from?.toISOString(),
            to: to?.toISOString(),
            action,
            resource,
            userId,
            severity,
          },
        },
        200,
        requestId,
      );
    },
  );
}
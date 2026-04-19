import { type AuditSeverity } from "@prisma/client";
import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth/authorization";
import { errorResponse } from "@/lib/http/api-response";
import { exportAuditEventsCsv } from "@/modules/audit/application/audit-service";

function parseDate(raw: string | null) {
  if (!raw) return undefined;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? undefined : value;
}

function parseSeverity(raw: string | null): AuditSeverity | undefined {
  if (!raw) return undefined;
  if (raw === "INFO" || raw === "WARNING" || raw === "CRITICAL") return raw;
  return undefined;
}

function parseMaxRows(raw: string | null) {
  const parsed = Number(raw ?? "1000");
  if (!Number.isFinite(parsed) || parsed < 1) return 1000;
  return Math.min(Math.trunc(parsed), 10000);
}

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("audit:read");
    const url = new URL(request.url);
    const action = (url.searchParams.get("action") ?? "").trim() || undefined;
    const resource = (url.searchParams.get("resource") ?? "").trim() || undefined;
    const userId = (url.searchParams.get("userId") ?? "").trim() || undefined;
    const from = parseDate(url.searchParams.get("from"));
    const to = parseDate(url.searchParams.get("to"));
    const severity = parseSeverity(url.searchParams.get("severity"));
    const maxRows = parseMaxRows(url.searchParams.get("maxRows"));

    const exported = await exportAuditEventsCsv({
      tenantId: context.tenantId,
      action,
      resource,
      userId,
      from,
      to,
      severity,
      maxRows,
    });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `audit-logs-${stamp}.csv`;

    return new Response(exported.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
        "x-request-id": requestId ?? "",
        "x-audit-exported-rows": String(exported.rowCount),
      },
    });
  } catch (error) {
    return errorResponse(error, {
      operation: "api.audit.logs.export",
      requestId,
    });
  }
}

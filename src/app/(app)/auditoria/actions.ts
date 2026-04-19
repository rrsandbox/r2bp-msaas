"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { handleServerActionError } from "@/lib/errors/server-action";
import { resolveRetentionExecution } from "@/modules/audit/application/audit-retention-policy";
import { recordAuditEventSafe, runAuditRetention } from "@/modules/audit/application/audit-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function runAuditRetentionAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("task:read");

    if (context.role !== "SUPER_ADMIN") {
      throw new AppError("Apenas o super usuario do sistema pode executar retencao de auditoria.", ErrorCodes.RBAC_FORBIDDEN, 403);
    }

    const retentionDaysRaw = readText(formData, "retentionDays");
    const resolved = resolveRetentionExecution({
      retentionDays: retentionDaysRaw ? Number(retentionDaysRaw) : undefined,
      dryRun: formData.get("dryRun") === "on",
      confirmDelete: formData.get("confirmDelete") === "on",
      reason: readText(formData, "reason"),
      tenantId: readText(formData, "targetTenantId") || undefined,
    });

    const result = await runAuditRetention({
      retentionDays: resolved.retentionDays,
      dryRun: resolved.dryRun,
      tenantId: resolved.tenantId,
    });

    await recordAuditEventSafe({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "AUDIT_RETENTION_EXECUTED",
      resource: "audit_log",
      severity: "WARNING",
      payload: {
        retentionDays: result.retentionDays,
        dryRun: result.dryRun,
        targetTenantId: result.tenantId,
        eligibleCount: result.eligibleCount,
        deletedCount: result.deletedCount,
        cutoff: result.cutoff.toISOString(),
        reason: resolved.reason,
      },
    });

    revalidatePath("/auditoria");

    const target = new URL("/auditoria", "http://localhost");
    target.searchParams.set("success", "retention");
    target.searchParams.set("deleted", String(result.deletedCount));
    target.searchParams.set("eligible", String(result.eligibleCount));
    target.searchParams.set("dryRun", String(result.dryRun));

    redirect(`${target.pathname}${target.search}` as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "audit.retention.run",
      redirectTo: "/auditoria",
      requestId,
    });
  }
}

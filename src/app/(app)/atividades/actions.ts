"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { approveTenantRegistration, rejectTenantRegistration } from "@/modules/auth/application/tenant-onboarding-service";
import { updateAdministrativeTaskStatus } from "@/modules/system/application/admin-task-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function approveTenantRegistrationAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("task:read");
    const registrationId = readText(formData, "registrationId");

    await approveTenantRegistration(registrationId, context);

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_REGISTRATION_APPROVED",
      resource: "tenant-registration",
      payload: { registrationId },
    });

    revalidatePath("/atividades");
    revalidatePath("/dashboard");
    revalidatePath("/tenants");
    redirect("/atividades?success=approved");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "activities.tenant-registration.approve",
      redirectTo: "/atividades",
      requestId,
    });
  }
}

export async function rejectTenantRegistrationAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("task:read");
    const registrationId = readText(formData, "registrationId");
    const notes = readText(formData, "reviewNotes");

    await rejectTenantRegistration(registrationId, notes || undefined, context);

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_REGISTRATION_REJECTED",
      resource: "tenant-registration",
      payload: { registrationId },
      severity: "WARNING",
    });

    revalidatePath("/atividades");
    revalidatePath("/dashboard");
    redirect("/atividades?success=rejected");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "activities.tenant-registration.reject",
      redirectTo: "/atividades",
      requestId,
    });
  }
}

export async function updateTaskStatusAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("task:read");
    const taskId = readText(formData, "taskId");
    const status = readText(formData, "status") as "OPEN" | "IN_PROGRESS" | "COMPLETED" | "DISMISSED";

    await updateAdministrativeTaskStatus(taskId, status, {
      role: context.role,
      tenantId: context.tenantId,
      userId: context.userId,
    });

    revalidatePath("/atividades");
    revalidatePath("/dashboard");
    redirect("/atividades?success=task-updated");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "activities.task.update-status",
      redirectTo: "/atividades",
      requestId,
    });
  }
}
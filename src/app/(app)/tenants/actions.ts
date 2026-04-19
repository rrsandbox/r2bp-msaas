"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { createTenant, deleteTenant, updateTenant } from "@/modules/tenant/application/tenant-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readReturnTo(formData: FormData) {
  const candidate = readText(formData, "returnTo");

  if (candidate.startsWith("/tenants")) {
    return candidate;
  }

  return "/tenants";
}

function withSuccessMessage(returnTo: string, successCode: "created" | "updated" | "deleted") {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}`;
}

export async function createTenantAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("tenant:update");
    if (context.role !== "SUPER_ADMIN") {
      throw new AppError("Apenas o super usuario do sistema pode criar tenants.", ErrorCodes.RBAC_FORBIDDEN, 403);
    }

    const name = readText(formData, "name");
    const slug = readText(formData, "slug");

    const tenant = await createTenant({
      name,
      slug: slug || undefined,
    });

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_CREATED",
      resource: "tenant",
      payload: {
        createdTenantId: tenant.id,
        createdTenantSlug: tenant.slug,
      },
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "created") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.page.create",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function updateTenantAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("tenant:update");
    const tenantId = readText(formData, "tenantId");
    const name = readText(formData, "name");
    const slug = readText(formData, "slug");
    const status = readText(formData, "status");

    const tenant = await updateTenant(
      tenantId,
      {
        name: name || undefined,
        slug: slug || undefined,
        status: status ? (status as "active" | "inactive" | "archived") : undefined,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
      },
    );

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_UPDATED",
      resource: "tenant",
      payload: {
        tenantId: tenant.id,
      },
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "updated") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.page.update",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function deleteTenantAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("tenant:update");
    const tenantId = readText(formData, "tenantId");

    await deleteTenant(tenantId, {
      role: context.role,
      tenantId: context.tenantId,
    });

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_DELETED",
      resource: "tenant",
      payload: {
        tenantId,
      },
      severity: "CRITICAL",
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "deleted") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.page.delete",
      redirectTo: returnTo,
      requestId,
    });
  }
}

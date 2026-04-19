"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import {
  createAccessFeature,
  deleteAccessFeature,
  deleteUserFeaturePermission,
  setUserFeaturePermission,
  updateAccessFeature,
} from "@/modules/access/application/access-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readReturnTo(formData: FormData) {
  const candidate = readText(formData, "returnTo");

  if (candidate.startsWith("/acessos")) {
    return candidate;
  }

  return "/acessos";
}

function withSuccessMessage(
  returnTo: string,
  successCode: "feature-created" | "feature-updated" | "feature-deleted" | "permission-updated" | "permission-deleted",
) {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}`;
}

export async function createAccessFeatureAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("access:write");
    const key = readText(formData, "key").toLowerCase();
    const name = readText(formData, "name");
    const description = readText(formData, "description");
    const route = readText(formData, "route");
    const showInMenu = formData.get("showInMenu") === "on";
    const showInDashboard = formData.get("showInDashboard") === "on";
    const sortOrderValue = readText(formData, "sortOrder");
    const sortOrder = sortOrderValue ? Number(sortOrderValue) : undefined;
    const enabled = formData.get("enabled") === "on";

    const feature = await createAccessFeature(
      {
        key,
        name,
        description: description || undefined,
        route: route || undefined,
        showInMenu,
        showInDashboard,
        sortOrder,
        enabled,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
      },
    );

    await recordAuditEvent({
      tenantId: feature.tenantId,
      userId: context.userId,
      action: "ACCESS_FEATURE_CREATED",
      resource: "access_feature",
      payload: {
        featureId: feature.id,
        key: feature.key,
      },
    });

    revalidatePath("/acessos");
    redirect(withSuccessMessage(returnTo, "feature-created") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "access.page.feature.create",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function setUserFeaturePermissionAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("access:write");
    const userId = readText(formData, "userId");
    const featureId = readText(formData, "featureId");
    const canAccess = formData.get("canAccess") === "on";

    const permission = await setUserFeaturePermission(
      {
        userId,
        featureId,
        canAccess,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
      },
    );

    await recordAuditEvent({
      tenantId: permission.tenantId,
      userId: context.userId,
      action: "ACCESS_PERMISSION_UPDATED",
      resource: "access_permission",
      payload: {
        permissionId: permission.id,
        targetUserId: permission.userId,
        featureId: permission.featureId,
        canAccess: permission.canAccess,
      },
    });

    revalidatePath("/acessos");
    redirect(withSuccessMessage(returnTo, "permission-updated") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "access.page.permission.update",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function updateAccessFeatureAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("access:write");
    const featureId = readText(formData, "featureId");
    const name = readText(formData, "name");
    const description = readText(formData, "description");
    const route = readText(formData, "route");
    const showInMenu = formData.get("showInMenu") === "on";
    const showInDashboard = formData.get("showInDashboard") === "on";
    const sortOrderValue = readText(formData, "sortOrder");
    const enabled = formData.get("enabled") === "on";

    const feature = await updateAccessFeature(
      featureId,
      {
        name,
        description: description || undefined,
        route: route || undefined,
        showInMenu,
        showInDashboard,
        sortOrder: sortOrderValue ? Number(sortOrderValue) : 100,
        enabled,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
      },
    );

    await recordAuditEvent({
      tenantId: feature.tenantId,
      userId: context.userId,
      action: "ACCESS_FEATURE_UPDATED",
      resource: "access_feature",
      payload: {
        featureId: feature.id,
        key: feature.key,
        enabled: feature.enabled,
      },
    });

    revalidatePath("/acessos");
    redirect(withSuccessMessage(returnTo, "feature-updated") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "access.page.feature.update",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function deleteAccessFeatureAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("access:write");
    const featureId = readText(formData, "featureId");

    const feature = await deleteAccessFeature(featureId, {
      role: context.role,
      tenantId: context.tenantId,
    });

    await recordAuditEvent({
      tenantId: feature.tenantId,
      userId: context.userId,
      action: "ACCESS_FEATURE_DELETED",
      resource: "access_feature",
      payload: {
        featureId: feature.id,
        key: feature.key,
        name: feature.name,
      },
      severity: "CRITICAL",
    });

    revalidatePath("/acessos");
    redirect(withSuccessMessage(returnTo, "feature-deleted") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "access.page.feature.delete",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function deleteUserFeaturePermissionAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("access:write");
    const permissionId = readText(formData, "permissionId");

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
        targetUserId: permission.userId,
        featureId: permission.featureId,
      },
      severity: "CRITICAL",
    });

    revalidatePath("/acessos");
    redirect(withSuccessMessage(returnTo, "permission-deleted") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "access.page.permission.delete",
      redirectTo: returnTo,
      requestId,
    });
  }
}

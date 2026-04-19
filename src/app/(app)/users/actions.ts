"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { createTenantInvite, resendTenantInvite } from "@/modules/auth/application/tenant-onboarding-service";
import { createUser, deleteUser, updateUser } from "@/modules/user/application/user-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readReturnTo(formData: FormData) {
  const candidate = readText(formData, "returnTo");

  if (candidate.startsWith("/users")) {
    return candidate;
  }

  return "/users";
}

function withSuccessMessage(returnTo: string, successCode: "created" | "updated" | "deleted") {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}`;
}

function withCustomSuccessMessage(returnTo: string, successCode: string) {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}`;
}

export async function createUserAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("user:create");
    const email = readText(formData, "email").toLowerCase();
    const name = readText(formData, "name");
    const role = readText(formData, "role");
    const tenantId = readText(formData, "tenantId");
    const password = readText(formData, "password");

    const user = await createUser(
      {
        email,
        name,
        role: role as "SUPER_ADMIN" | "ADMIN" | "USER",
        tenantId: tenantId || undefined,
        password: password || undefined,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      },
    );

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

    revalidatePath("/users");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "created") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "user.page.create",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function updateUserAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("user:update");
    const userId = readText(formData, "userId");
    const name = readText(formData, "name");
    const status = readText(formData, "status");
    const role = readText(formData, "role");

    const user = await updateUser(
      userId,
      {
        name: name || undefined,
        status: status ? (status as "PENDING_APPROVAL" | "INVITED" | "ACTIVE" | "INACTIVE" | "BLOCKED" | "DELETED") : undefined,
        role: role ? (role as "SUPER_ADMIN" | "ADMIN" | "USER") : undefined,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      },
    );

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "USER_UPDATED",
      resource: "user",
      payload: {
        userId: user.userId,
      },
    });

    revalidatePath("/users");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "updated") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "user.page.update",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function createTenantInviteAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("invite:create");
    const email = readText(formData, "email").toLowerCase();
    const expiresInDays = readText(formData, "expiresInDays");

    const invite = await createTenantInvite(
      {
        email,
        role: "USER",
        expiresInDays: expiresInDays || "7",
      },
      {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      },
    );

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "USER_INVITE_CREATED",
      resource: "invite",
      payload: {
        inviteId: invite.id,
        email: invite.email,
      },
    });

    revalidatePath("/users");
    revalidatePath("/dashboard");
    redirect(withCustomSuccessMessage(returnTo, "invite-created") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "user.page.invite.create",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function resendTenantInviteAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("invite:update");
    const inviteId = readText(formData, "inviteId");

    const invite = await resendTenantInvite(inviteId, {
      role: context.role,
      tenantId: context.tenantId,
      userId: context.userId,
    });

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "USER_INVITE_RESENT",
      resource: "invite",
      payload: {
        inviteId: invite.id,
        email: invite.email,
      },
    });

    revalidatePath("/users");
    revalidatePath("/dashboard");
    redirect(withCustomSuccessMessage(returnTo, "invite-resent") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "user.page.invite.resend",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function deleteUserAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("user:update");
    const userId = readText(formData, "userId");

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

    revalidatePath("/users");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "deleted") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "user.page.delete",
      redirectTo: returnTo,
      requestId,
    });
  }
}

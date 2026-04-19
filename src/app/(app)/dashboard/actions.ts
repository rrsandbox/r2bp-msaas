"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import {
  createPublicTenantComment,
  deletePublicTenantComment,
  updatePublicTenantComment,
} from "@/modules/marketing/application/public-comment-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readReturnTo(formData: FormData) {
  const candidate = readText(formData, "returnTo");

  if (candidate.startsWith("/dashboard")) {
    return candidate;
  }

  return "/dashboard";
}

function withSuccessMessage(returnTo: string, successCode: "comment-created" | "comment-updated" | "comment-deleted") {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}`;
}

export async function createPublicCommentAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth();
    const comment = readText(formData, "comment");

    const createdComment = await createPublicTenantComment(
      { comment },
      {
        tenantId: context.tenantId,
        userId: context.userId,
        role: context.role,
      },
    );

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "PUBLIC_TENANT_COMMENT_CREATED",
      resource: "public_tenant_comment",
      payload: {
        commentId: createdComment.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "comment-created") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "dashboard.comment.create",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function updatePublicCommentAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth();
    const commentId = readText(formData, "commentId");
    const comment = readText(formData, "comment");

    const updatedComment = await updatePublicTenantComment(
      commentId,
      { comment },
      {
        tenantId: context.tenantId,
        role: context.role,
      },
    );

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "PUBLIC_TENANT_COMMENT_UPDATED",
      resource: "public_tenant_comment",
      payload: {
        commentId: updatedComment.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "comment-updated") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "dashboard.comment.update",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function deletePublicCommentAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth();
    const commentId = readText(formData, "commentId");

    const deletedComment = await deletePublicTenantComment(commentId, {
      tenantId: context.tenantId,
      role: context.role,
    });

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "PUBLIC_TENANT_COMMENT_DELETED",
      resource: "public_tenant_comment",
      payload: {
        commentId: deletedComment.id,
      },
      severity: "WARNING",
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "comment-deleted") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "dashboard.comment.delete",
      redirectTo: returnTo,
      requestId,
    });
  }
}

import { headers } from "next/headers";

import { prisma } from "@/infra/db/prisma";
import { requireAuth } from "@/lib/auth/authorization";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import {
  createPublicTenantComment,
  deletePublicTenantComment,
  updatePublicTenantComment,
} from "@/modules/marketing/application/public-comment-service";

function readText(body: Record<string, unknown>, key: string) {
  return String(body[key] ?? "").trim();
}

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.comments.list",
      requestId,
    },
    async () => {
      const context = await requireAuth();
      const url = new URL(request.url);
      const limitParam = Number(url.searchParams.get("limit") ?? "5");
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 5;

      const items = await prisma.publicTenantComment.findMany({
        where: {
          tenantId: context.tenantId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        select: {
          id: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return successResponse(
        {
          items: items.map((item) => ({
            id: item.id,
            comment: item.comment,
            createdAt: item.createdAt,
            authorName: item.user.name ?? item.user.email,
          })),
        },
        200,
        requestId,
      );
    },
  );
}

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.comments.create",
      requestId,
    },
    async () => {
      const context = await requireAuth();
      const payload = await request.json();

      const comment = await createPublicTenantComment(payload, {
        tenantId: context.tenantId,
        userId: context.userId,
        role: context.role,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "PUBLIC_TENANT_COMMENT_CREATED",
        resource: "public_tenant_comment",
        payload: {
          commentId: comment.id,
        },
      });

      return successResponse({ comment }, 201, requestId);
    },
  );
}

export async function PUT(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.comments.update",
      requestId,
    },
    async () => {
      const context = await requireAuth();
      const payload = (await request.json()) as Record<string, unknown>;
      const commentId = readText(payload, "commentId");

      const comment = await updatePublicTenantComment(
        commentId,
        {
          comment: readText(payload, "comment"),
        },
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
          commentId: comment.id,
        },
      });

      return successResponse({ comment }, 200, requestId);
    },
  );
}

export async function DELETE(request: Request) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.tenants.comments.delete",
      requestId,
    },
    async () => {
      const context = await requireAuth();
      const payload = (await request.json()) as Record<string, unknown>;
      const commentId = readText(payload, "commentId");

      const comment = await deletePublicTenantComment(commentId, {
        tenantId: context.tenantId,
        role: context.role,
      });

      await recordAuditEvent({
        tenantId: context.tenantId,
        userId: context.userId,
        action: "PUBLIC_TENANT_COMMENT_DELETED",
        resource: "public_tenant_comment",
        payload: {
          commentId: comment.id,
        },
        severity: "WARNING",
      });

      return successResponse({ comment }, 200, requestId);
    },
  );
}

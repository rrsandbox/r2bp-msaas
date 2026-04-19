import { RoleKey } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";

const createPublicCommentSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(8, "Comentario precisa ter pelo menos 8 caracteres.")
    .max(400, "Comentario nao pode ultrapassar 400 caracteres."),
});

const ALLOWED_AUTHOR_ROLES: RoleKey[] = [RoleKey.SUPER_ADMIN, RoleKey.ADMIN];
const LANDING_COMMENT_LIMIT = 20;

type PublicCommentDelegate = {
  create: (args: {
    data: { tenantId: string; userId: string; comment: string };
    select: { id: true; tenantId: true; comment: true; createdAt: true };
  }) => Promise<{ id: string; tenantId: string; comment: string; createdAt: Date }>;
  findMany: (args: {
    take: number;
    orderBy: { createdAt: "desc" };
    select: {
      id: true;
      tenantId: true;
      comment: true;
      createdAt: true;
      tenant: { select: { name: true } };
      user: {
        select: {
          name: true;
          email: true;
          memberships: {
            where: { role: { in: RoleKey[] } };
            select: { tenantId: true; role: true };
          };
        };
      };
    };
  }) => Promise<Array<{
    id: string;
    tenantId: string;
    comment: string;
    createdAt: Date;
    tenant: { name: string };
    user: {
      name: string | null;
      email: string;
      memberships: Array<{ tenantId: string; role: RoleKey }>;
    };
  }>>;
  findFirst: (args: {
    where: { id: string; tenantId: string };
    select: { id: true; tenantId: true; comment: true };
  }) => Promise<{ id: string; tenantId: string; comment: string } | null>;
  update: (args: {
    where: { id: string };
    data: { comment: string };
    select: { id: true; tenantId: true; comment: true; createdAt: true };
  }) => Promise<{ id: string; tenantId: string; comment: string; createdAt: Date }>;
  delete: (args: {
    where: { id: string };
    select: { id: true; tenantId: true; comment: true };
  }) => Promise<{ id: string; tenantId: string; comment: string }>;
};

function getPublicCommentDelegate(): PublicCommentDelegate | null {
  const maybeDelegate = (prisma as unknown as { publicTenantComment?: PublicCommentDelegate }).publicTenantComment;
  return maybeDelegate ?? null;
}

export type LandingPublicComment = {
  id: string;
  comment: string;
  createdAt: string;
  tenantName: string;
  authorName: string;
  authorRole: RoleKey;
};

export async function createPublicTenantComment(input: unknown, scope: { tenantId: string; userId: string; role: RoleKey }) {
  if (!ALLOWED_AUTHOR_ROLES.includes(scope.role)) {
    throw new AppError(
      "Somente super usuarios e administradores podem publicar comentarios na landing.",
      ErrorCodes.RBAC_FORBIDDEN,
      403,
    );
  }

  const payload = createPublicCommentSchema.parse(input);

  const comments = getPublicCommentDelegate();
  if (!comments) {
    throw new AppError(
      "Modulo de comentarios indisponivel. Rode npm run db:generate e reinicie o servidor.",
      ErrorCodes.INFRA_UNAVAILABLE,
      503,
    );
  }

  return comments.create({
    data: {
      tenantId: scope.tenantId,
      userId: scope.userId,
      comment: payload.comment,
    },
    select: {
      id: true,
      tenantId: true,
      comment: true,
      createdAt: true,
    },
  });
}

export async function listLatestLandingComments(limit = LANDING_COMMENT_LIMIT): Promise<LandingPublicComment[]> {
  const safeLimit = Math.min(Math.max(limit, 1), LANDING_COMMENT_LIMIT);

  const commentDelegate = getPublicCommentDelegate();
  if (!commentDelegate) {
    return [];
  }

  const comments = await commentDelegate.findMany({
    take: safeLimit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      tenantId: true,
      comment: true,
      createdAt: true,
      tenant: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          memberships: {
            where: {
              role: {
                in: ALLOWED_AUTHOR_ROLES,
              },
            },
            select: {
              tenantId: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return comments
    .map((item) => {
      const membership = item.user.memberships.find((entry) => entry.tenantId === item.tenantId);
      const role = membership?.role;
      if (!role || !ALLOWED_AUTHOR_ROLES.includes(role)) {
        return null;
      }

      return {
        id: item.id,
        comment: item.comment,
        createdAt: item.createdAt.toISOString(),
        tenantName: item.tenant.name,
        authorName: item.user.name ?? item.user.email,
        authorRole: role,
      } satisfies LandingPublicComment;
    })
    .filter((item): item is LandingPublicComment => item !== null);
}

export async function updatePublicTenantComment(
  commentId: string,
  input: unknown,
  scope: { tenantId: string; role: RoleKey },
) {
  if (!ALLOWED_AUTHOR_ROLES.includes(scope.role)) {
    throw new AppError(
      "Somente super usuarios e administradores podem editar comentarios na landing.",
      ErrorCodes.RBAC_FORBIDDEN,
      403,
    );
  }

  const payload = createPublicCommentSchema.parse(input);
  const commentDelegate = getPublicCommentDelegate();

  if (!commentDelegate) {
    throw new AppError(
      "Modulo de comentarios indisponivel. Rode npm run db:generate e reinicie o servidor.",
      ErrorCodes.INFRA_UNAVAILABLE,
      503,
    );
  }

  const existing = await commentDelegate.findFirst({
    where: {
      id: commentId,
      tenantId: scope.tenantId,
    },
    select: {
      id: true,
      tenantId: true,
      comment: true,
    },
  });

  if (!existing) {
    throw new AppError("Comentario nao encontrado para este tenant.", ErrorCodes.PUBLIC_COMMENT_NOT_FOUND, 404);
  }

  return commentDelegate.update({
    where: {
      id: existing.id,
    },
    data: {
      comment: payload.comment,
    },
    select: {
      id: true,
      tenantId: true,
      comment: true,
      createdAt: true,
    },
  });
}

export async function deletePublicTenantComment(commentId: string, scope: { tenantId: string; role: RoleKey }) {
  if (!ALLOWED_AUTHOR_ROLES.includes(scope.role)) {
    throw new AppError(
      "Somente super usuarios e administradores podem excluir comentarios na landing.",
      ErrorCodes.RBAC_FORBIDDEN,
      403,
    );
  }

  const commentDelegate = getPublicCommentDelegate();

  if (!commentDelegate) {
    throw new AppError(
      "Modulo de comentarios indisponivel. Rode npm run db:generate e reinicie o servidor.",
      ErrorCodes.INFRA_UNAVAILABLE,
      503,
    );
  }

  const existing = await commentDelegate.findFirst({
    where: {
      id: commentId,
      tenantId: scope.tenantId,
    },
    select: {
      id: true,
      tenantId: true,
      comment: true,
    },
  });

  if (!existing) {
    throw new AppError("Comentario nao encontrado para este tenant.", ErrorCodes.PUBLIC_COMMENT_NOT_FOUND, 404);
  }

  return commentDelegate.delete({
    where: {
      id: existing.id,
    },
    select: {
      id: true,
      tenantId: true,
      comment: true,
    },
  });
}

import bcrypt from "bcryptjs";
import { Prisma, type RoleKey, type UserStatus } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { createUserSchema, type CreateUserInput, updateUserSchema, type UpdateUserInput } from "@/lib/validation/user/user.schema";

type UserScope = {
  role: RoleKey;
  tenantId: string;
  userId: string;
};

type ListUsersFilters = {
  tenantId?: string;
  query?: string;
};

type UserPagination = {
  page?: number;
  pageSize?: number;
};

function normalizePagination(pagination?: UserPagination) {
  const page = Number.isFinite(pagination?.page) ? Number(pagination?.page) : 1;
  const pageSize = Number.isFinite(pagination?.pageSize) ? Number(pagination?.pageSize) : 10;

  return {
    page: Math.max(1, page),
    pageSize: Math.min(50, Math.max(1, pageSize)),
  };
}

function resolveMembershipWhere(scope: UserScope, filters?: ListUsersFilters) {
  if (scope.role === "USER") {
    return {
      tenantId: scope.tenantId,
      userId: scope.userId,
    };
  }

  const targetTenantId = scope.role === "SUPER_ADMIN" ? filters?.tenantId : scope.tenantId;
  const query = filters?.query?.trim();
  // ADMIN nunca enxerga memberships de SUPER_ADMIN
  const roleFilter = scope.role === "ADMIN" ? { NOT: { role: "SUPER_ADMIN" as const } } : {};

  return {
    ...(targetTenantId ? { tenantId: targetTenantId } : {}),
    ...roleFilter,
    ...(query
      ? {
          OR: [
            {
              user: {
                name: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              user: {
                email: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };
}

function mapMembershipToUserItem(membership: {
  user: {
    id: string;
    name: string | null;
    email: string;
    status: UserStatus;
    createdAt: Date;
  };
  tenantId: string;
  role: RoleKey;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}) {
  return {
    userId: membership.user.id,
    tenantId: membership.tenantId,
    tenantName: membership.tenant.name,
    tenantSlug: membership.tenant.slug,
    name: membership.user.name,
    email: membership.user.email,
    role: membership.role,
    status: membership.user.status,
    createdAt: membership.user.createdAt,
  };
}

function toJsonValue(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

function canManageTenantUsers(role: RoleKey) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function assertCanManageTenantUsers(scope: UserScope) {
  if (canManageTenantUsers(scope.role)) {
    return;
  }

  throw new AppError("Usuario sem permissao para gerenciar usuarios do tenant.", ErrorCodes.RBAC_FORBIDDEN, 403);
}

export async function listUsers(scope: UserScope, filters?: ListUsersFilters) {
  const where = resolveMembershipWhere(scope, filters);

  const memberships = await prisma.tenantMembership.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return memberships.map(mapMembershipToUserItem);
}

export async function listUsersPaginated(scope: UserScope, filters?: ListUsersFilters, pagination?: UserPagination) {
  const { page, pageSize } = normalizePagination(pagination);
  const where = resolveMembershipWhere(scope, filters);

  const [total, memberships] = await Promise.all([
    prisma.tenantMembership.count({ where }),
    prisma.tenantMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  if (safePage !== page) {
    const fallbackMemberships = await prisma.tenantMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: fallbackMemberships.map(mapMembershipToUserItem),
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  return {
    items: memberships.map(mapMembershipToUserItem),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function createUser(input: CreateUserInput, scope: UserScope) {
  assertCanManageTenantUsers(scope);

  const payload = createUserSchema.parse(input);
  const targetTenantId = scope.role === "SUPER_ADMIN" ? (payload.tenantId ?? scope.tenantId) : scope.tenantId;

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("Usuario com este e-mail ja existe.", ErrorCodes.CONFLICT, 409);
  }

  const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : null;

  const createdUser = await prisma.user.create({
    data: {
      email: payload.email,
      name: payload.name,
      passwordHash,
      status: payload.password ? "ACTIVE" : "INVITED",
      profile: toJsonValue(payload.profile),
      isProfileComplete: payload.isProfileComplete ?? Boolean(payload.profile),
      profileCompletedAt: payload.isProfileComplete ?? Boolean(payload.profile) ? new Date() : undefined,
      memberships: {
        create: {
          tenantId: targetTenantId,
          role: payload.role,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      memberships: {
        select: {
          tenantId: true,
          role: true,
        },
      },
    },
  });

  return {
    userId: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    status: createdUser.status,
    tenantId: targetTenantId,
    role: payload.role,
  };
}

export async function updateUser(userId: string, input: UpdateUserInput, scope: UserScope) {
  assertCanManageTenantUsers(scope);

  const payload = updateUserSchema.parse(input);

  const membership = await prisma.tenantMembership.findFirst({
    where: {
      userId,
      ...(scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId }),
    },
    include: {
      user: true,
    },
  });

  if (!membership) {
    throw new AppError("Usuario nao encontrado no escopo do tenant.", ErrorCodes.USER_NOT_FOUND, 404);
  }

  if (scope.role === "ADMIN" && membership.role === "SUPER_ADMIN") {
    throw new AppError("Administrador do tenant nao pode editar o super usuario do sistema.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  const data: { name?: string; status?: UserStatus } = {};
  const profileData: { profile?: Prisma.InputJsonValue; isProfileComplete?: boolean; profileCompletedAt?: Date | null; deactivatedAt?: Date | null } = {};

  if (payload.name) {
    data.name = payload.name;
  }

  if (payload.status) {
    data.status = payload.status;
    if (["INACTIVE", "BLOCKED", "DELETED"].includes(payload.status)) {
      profileData.deactivatedAt = new Date();
    }
  }

  if (payload.profile) {
    profileData.profile = toJsonValue(payload.profile);
  }

  if (typeof payload.isProfileComplete === "boolean") {
    profileData.isProfileComplete = payload.isProfileComplete;
    profileData.profileCompletedAt = payload.isProfileComplete ? new Date() : null;
  }

  if (Object.keys(data).length > 0 || Object.keys(profileData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...profileData,
      },
    });
  }

  if (payload.role) {
    await prisma.tenantMembership.update({
      where: { id: membership.id },
      data: { role: payload.role },
    });
  }

  return {
    userId,
    name: payload.name ?? membership.user.name,
    status: payload.status ?? membership.user.status,
    role: payload.role ?? membership.role,
  };
}

export async function deleteUser(userId: string, scope: UserScope) {
  assertCanManageTenantUsers(scope);

  const membership = await prisma.tenantMembership.findFirst({
    where: {
      userId,
      ...(scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId }),
    },
  });

  if (!membership) {
    throw new AppError("Usuario nao encontrado no escopo do tenant.", ErrorCodes.USER_NOT_FOUND, 404);
  }

  if (scope.role === "ADMIN" && membership.role === "SUPER_ADMIN") {
    throw new AppError("Administrador do tenant nao pode excluir o super usuario do sistema.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  await prisma.tenantMembership.delete({
    where: {
      id: membership.id,
    },
  });

  const remainingMemberships = await prisma.tenantMembership.count({
    where: { userId },
  });

  if (remainingMemberships === 0) {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}
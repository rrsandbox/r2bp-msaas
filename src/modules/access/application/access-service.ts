import { type RoleKey } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import {
  createAccessFeatureSchema,
  type CreateAccessFeatureInput,
  updateAccessFeatureSchema,
  type UpdateAccessFeatureInput,
  setUserFeaturePermissionSchema,
  type SetUserFeaturePermissionInput,
} from "@/lib/validation/access/access.schema";

type AccessScope = {
  role: RoleKey;
  tenantId: string;
};

function ensureManageScope(scope: AccessScope, tenantId: string) {
  if (scope.role === "SUPER_ADMIN") {
    return;
  }

  if (scope.tenantId !== tenantId) {
    throw new AppError("Permissao insuficiente para gerenciar acessos deste tenant.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }
}

function assertSuperAdmin(scope: AccessScope) {
  if (scope.role !== "SUPER_ADMIN") {
    throw new AppError("Somente o super usuario do sistema pode criar, editar ou excluir features de acesso.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }
}

export async function listAccessFeatures(scope: AccessScope) {
  const where = scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId };

  const items = await prisma.accessFeature.findMany({
    where,
    orderBy: [{ tenantId: "asc" }, { key: "asc" }],
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    tenantName: item.tenant.name,
    tenantSlug: item.tenant.slug,
    key: item.key,
    name: item.name,
    description: item.description,
    route: item.route,
    showInMenu: item.showInMenu,
    showInDashboard: item.showInDashboard,
    sortOrder: item.sortOrder,
    enabled: item.enabled,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function createAccessFeature(input: CreateAccessFeatureInput, scope: AccessScope) {
  assertSuperAdmin(scope);

  const payload = createAccessFeatureSchema.parse(input);
  const tenantId = scope.role === "SUPER_ADMIN" ? (payload.tenantId ?? scope.tenantId) : scope.tenantId;

  ensureManageScope(scope, tenantId);

  const created = await prisma.accessFeature.create({
    data: {
      tenantId,
      key: payload.key,
      name: payload.name,
      description: payload.description,
      route: payload.route,
      showInMenu: payload.showInMenu ?? false,
      showInDashboard: payload.showInDashboard ?? false,
      sortOrder: payload.sortOrder ?? 100,
      enabled: payload.enabled ?? true,
    },
    select: {
      id: true,
      tenantId: true,
      key: true,
      name: true,
      route: true,
      showInMenu: true,
      showInDashboard: true,
      sortOrder: true,
      enabled: true,
      createdAt: true,
    },
  });

  return created;
}

export async function updateAccessFeature(featureId: string, input: UpdateAccessFeatureInput, scope: AccessScope) {
  assertSuperAdmin(scope);

  const payload = updateAccessFeatureSchema.parse(input);

  const existing = await prisma.accessFeature.findUnique({
    where: { id: featureId },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (!existing) {
    throw new AppError("Feature de acesso nao encontrada.", ErrorCodes.ACCESS_FEATURE_NOT_FOUND, 404);
  }

  ensureManageScope(scope, existing.tenantId);

  const updated = await prisma.accessFeature.update({
    where: {
      id: featureId,
    },
    data: {
      name: payload.name,
      description: payload.description,
      route: payload.route,
      showInMenu: payload.showInMenu,
      showInDashboard: payload.showInDashboard,
      sortOrder: payload.sortOrder,
      enabled: payload.enabled,
    },
    select: {
      id: true,
      tenantId: true,
      key: true,
      name: true,
      route: true,
      showInMenu: true,
      showInDashboard: true,
      sortOrder: true,
      enabled: true,
      updatedAt: true,
    },
  });

  return updated;
}

export async function deleteAccessFeature(featureId: string, scope: AccessScope) {
  assertSuperAdmin(scope);

  const existing = await prisma.accessFeature.findUnique({
    where: { id: featureId },
    select: {
      id: true,
      tenantId: true,
      key: true,
      name: true,
    },
  });

  if (!existing) {
    throw new AppError("Feature de acesso nao encontrada.", ErrorCodes.ACCESS_FEATURE_NOT_FOUND, 404);
  }

  ensureManageScope(scope, existing.tenantId);

  await prisma.accessFeature.delete({
    where: {
      id: featureId,
    },
  });

  return existing;
}

export async function setUserFeaturePermission(input: SetUserFeaturePermissionInput, scope: AccessScope) {
  const payload = setUserFeaturePermissionSchema.parse(input);
  const tenantId = scope.role === "SUPER_ADMIN" ? (payload.tenantId ?? scope.tenantId) : scope.tenantId;

  ensureManageScope(scope, tenantId);

  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: payload.userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new AppError("Usuario nao pertence ao tenant informado.", ErrorCodes.USER_NOT_FOUND, 404);
  }

  const feature = await prisma.accessFeature.findFirst({
    where: {
      id: payload.featureId,
      tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!feature) {
    throw new AppError("Feature de acesso nao encontrada para este tenant.", ErrorCodes.ACCESS_FEATURE_NOT_FOUND, 404);
  }

  const permission = await prisma.userFeaturePermission.upsert({
    where: {
      tenantId_userId_featureId: {
        tenantId,
        userId: payload.userId,
        featureId: payload.featureId,
      },
    },
    update: {
      canAccess: payload.canAccess,
    },
    create: {
      tenantId,
      userId: payload.userId,
      featureId: payload.featureId,
      canAccess: payload.canAccess,
    },
    select: {
      id: true,
      tenantId: true,
      userId: true,
      featureId: true,
      canAccess: true,
      updatedAt: true,
    },
  });

  return permission;
}

export async function deleteUserFeaturePermission(permissionId: string, scope: AccessScope) {
  const existing = await prisma.userFeaturePermission.findUnique({
    where: {
      id: permissionId,
    },
    select: {
      id: true,
      tenantId: true,
      userId: true,
      featureId: true,
    },
  });

  if (!existing) {
    throw new AppError("Permissao de acesso nao encontrada.", ErrorCodes.ACCESS_PERMISSION_NOT_FOUND, 404);
  }

  ensureManageScope(scope, existing.tenantId);

  await prisma.userFeaturePermission.delete({
    where: {
      id: permissionId,
    },
  });

  return existing;
}

export async function listUserFeaturePermissions(scope: AccessScope) {
  const where = scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId };

  const items = await prisma.userFeaturePermission.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      feature: {
        select: {
          id: true,
          key: true,
          name: true,
          enabled: true,
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
    orderBy: [{ updatedAt: "desc" }],
  });

  return items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    tenantName: item.tenant.name,
    tenantSlug: item.tenant.slug,
    userId: item.userId,
    userName: item.user.name,
    userEmail: item.user.email,
    featureId: item.featureId,
    featureKey: item.feature.key,
    featureName: item.feature.name,
    featureEnabled: item.feature.enabled,
    canAccess: item.canAccess,
    updatedAt: item.updatedAt,
  }));
}

import { type RoleKey } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { hasPermission } from "@/config/rbac";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";

type PermissionScope = {
  role: RoleKey;
  tenantId: string;
  userId: string;
};

export async function listAllowedPermissions(scope: PermissionScope, permissions: string[]) {
  const result: Record<string, boolean> = {};

  if (permissions.length === 0) {
    return result;
  }

  if (scope.role === "SUPER_ADMIN") {
    permissions.forEach((permission) => {
      result[permission] = true;
    });

    return result;
  }

  permissions.forEach((permission) => {
    result[permission] = hasPermission(scope.role, permission);
  });

  try {
    const features = await prisma.accessFeature.findMany({
      where: {
        tenantId: scope.tenantId,
        key: {
          in: permissions,
        },
      },
      select: {
        id: true,
        key: true,
        enabled: true,
      },
    });

    if (features.length === 0) {
      return result;
    }

    const featureByKey = new Map(features.map((feature) => [feature.key, feature]));
    const featureIds = features.map((feature) => feature.id);

    const userPermissions = await prisma.userFeaturePermission.findMany({
      where: {
        tenantId: scope.tenantId,
        userId: scope.userId,
        featureId: {
          in: featureIds,
        },
      },
      select: {
        featureId: true,
        canAccess: true,
      },
    });

    const permissionByFeatureId = new Map(userPermissions.map((permission) => [permission.featureId, permission]));

    permissions.forEach((permission) => {
      const feature = featureByKey.get(permission);

      if (!feature) {
        return;
      }

      if (!feature.enabled) {
        result[permission] = false;
        return;
      }

      const userPermission = permissionByFeatureId.get(feature.id);

      if (userPermission) {
        result[permission] = userPermission.canAccess;
      }
    });
  } catch (error) {
    if (!isInfrastructureUnavailableError(error)) {
      throw error;
    }
  }

  return result;
}

export async function canAccessPermission(scope: PermissionScope, requiredPermission: string) {
  const allowed = await listAllowedPermissions(scope, [requiredPermission]);
  return Boolean(allowed[requiredPermission]);
}

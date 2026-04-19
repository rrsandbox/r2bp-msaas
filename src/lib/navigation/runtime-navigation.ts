import type { RoleKey } from "@prisma/client";

import { appNavigationCatalog, type AppNavigationItem } from "@/config/app-navigation";
import { prisma } from "@/infra/db/prisma";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { listAllowedPermissions } from "@/lib/auth/permission-check";

type RuntimeScope = {
  role: RoleKey;
  tenantId: string;
  userId: string;
};

type NavigationArea = "menu" | "dashboard";

function fallbackItems(area: NavigationArea) {
  return appNavigationCatalog.filter((item) => (area === "menu" ? item.showInMenu : item.showInDashboard));
}

async function filterByPermission(scope: RuntimeScope, items: AppNavigationItem[]) {
  const requiredPermissions = items
    .map((item) => item.permission)
    .filter((value): value is string => Boolean(value));

  const allowedPermissions = await listAllowedPermissions(scope, requiredPermissions);

  return items.filter((item) => {
    if (!item.permission) {
      return true;
    }

    return Boolean(allowedPermissions[item.permission]);
  });
}

export async function listNavigationByArea(scope: RuntimeScope, area: NavigationArea) {
  const fallback = fallbackItems(area);

  try {
    const configuredItems = await prisma.accessFeature.findMany({
      where: {
        tenantId: scope.tenantId,
        enabled: true,
        route: {
          not: null,
        },
        ...(area === "menu" ? { showInMenu: true } : { showInDashboard: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        route: true,
        name: true,
        description: true,
        key: true,
      },
    });

    if (configuredItems.length === 0) {
      return filterByPermission(scope, fallback);
    }

    const dbItems: AppNavigationItem[] = configuredItems
      .filter((item): item is typeof item & { route: string } => Boolean(item.route))
      .map((item) => ({
        href: item.route,
        label: item.name,
        description: item.description ?? undefined,
        permission: item.key,
        showInMenu: area === "menu",
        showInDashboard: area === "dashboard",
      }));

    return filterByPermission(scope, dbItems);
  } catch (error) {
    if (isInfrastructureUnavailableError(error)) {
      return filterByPermission(scope, fallback);
    }

    throw error;
  }
}

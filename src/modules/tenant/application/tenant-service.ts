import { Prisma, type RoleKey } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { slugify } from "@/lib/utils/slugify";
import { createTenantSchema, type CreateTenantInput, updateTenantSchema, type UpdateTenantInput } from "@/lib/validation/tenant/tenant.schema";

type TenantScope = {
  role: RoleKey;
  tenantId: string;
};

type TenantListFilters = {
  query?: string;
};

type TenantPagination = {
  page?: number;
  pageSize?: number;
};

type TenantListItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  onboardingStatus: string;
  admins: number;
  createdAt: Date;
};

function normalizePagination(pagination?: TenantPagination) {
  const page = Number.isFinite(pagination?.page) ? Number(pagination?.page) : 1;
  const pageSize = Number.isFinite(pagination?.pageSize) ? Number(pagination?.pageSize) : 10;

  return {
    page: Math.max(1, page),
    pageSize: Math.min(50, Math.max(1, pageSize)),
  };
}

function mapTenantItem(tenant: {
  id: string;
  name: string;
  slug: string;
  status: string;
  onboardingStatus: string;
  createdAt: Date;
  memberships: Array<{ id: string }>;
}): TenantListItem {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    onboardingStatus: tenant.onboardingStatus,
    admins: tenant.memberships.length,
    createdAt: tenant.createdAt,
  };
}

function toJsonValue(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

export async function listTenants(scope: TenantScope) {
  const where = scope.role === "SUPER_ADMIN" ? {} : { id: scope.tenantId };

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      
      memberships: {
        where: {
          role: {
            in: ["SUPER_ADMIN", "ADMIN"],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  return tenants.map(mapTenantItem);
}

export async function listTenantsPaginated(scope: TenantScope, filters?: TenantListFilters, pagination?: TenantPagination) {
  const { page, pageSize } = normalizePagination(pagination);
  const query = filters?.query?.trim();

  const where = {
    ...(scope.role === "SUPER_ADMIN" ? {} : { id: scope.tenantId }),
    ...(query
      ? {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              slug: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [total, tenants] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        memberships: {
          where: {
            role: {
              in: ["SUPER_ADMIN", "ADMIN"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  if (safePage !== page) {
    const fallbackTenants = await prisma.tenant.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        memberships: {
          where: {
            role: {
              in: ["SUPER_ADMIN", "ADMIN"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    return {
      items: fallbackTenants.map(mapTenantItem),
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  return {
    items: tenants.map(mapTenantItem),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function createTenant(input: CreateTenantInput) {
  const payload = createTenantSchema.parse(input);
  const slug = payload.slug ?? slugify(payload.name);

  const exists = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (exists) {
    throw new AppError("Slug do tenant ja existe.", ErrorCodes.CONFLICT, 409);
  }

  return prisma.tenant.create({
    data: {
      name: payload.name,
      slug,
      legalProfile: toJsonValue(payload.legalProfile),
      billingProfile: toJsonValue(payload.billingProfile),
      adminProfile: toJsonValue(payload.adminProfile),
      settings: {
        create: {},
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function updateTenant(tenantId: string, input: UpdateTenantInput, scope: TenantScope) {
  const payload = updateTenantSchema.parse(input);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    throw new AppError("Tenant nao encontrado.", ErrorCodes.TENANT_NOT_FOUND, 404);
  }

  if (scope.role !== "SUPER_ADMIN" && scope.tenantId !== tenantId) {
    throw new AppError("Permissao insuficiente para atualizar este tenant.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  if (payload.slug) {
    const slugOwner = await prisma.tenant.findUnique({
      where: { slug: payload.slug },
      select: { id: true },
    });

    if (slugOwner && slugOwner.id !== tenantId) {
      throw new AppError("Slug do tenant ja existe.", ErrorCodes.CONFLICT, 409);
    }
  }

  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: payload.name,
      slug: payload.slug,
      status: payload.status,
      onboardingStatus: payload.onboardingStatus,
      legalProfile: toJsonValue(payload.legalProfile),
      billingProfile: toJsonValue(payload.billingProfile),
      adminProfile: toJsonValue(payload.adminProfile),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      onboardingStatus: true,
      updatedAt: true,
    },
  });
}

export async function deleteTenant(tenantId: string, scope: TenantScope) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    throw new AppError("Tenant nao encontrado.", ErrorCodes.TENANT_NOT_FOUND, 404);
  }

  if (scope.role !== "SUPER_ADMIN") {
    throw new AppError("Apenas super-admin pode remover tenants.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  await prisma.tenant.delete({
    where: { id: tenantId },
  });
}
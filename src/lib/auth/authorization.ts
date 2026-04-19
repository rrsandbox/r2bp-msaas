import { type RoleKey } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { canAccessPermission } from "@/lib/auth/permission-check";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { prisma } from "@/infra/db/prisma";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";

export type AuthContext = {
  userId: string;
  tenantId: string;
  role: RoleKey;
  tenantName?: string;
  tenantStatus?: string;
  tenantOnboardingStatus?: string;
  userStatus?: string;
  isProfileComplete: boolean;
};

export async function requireAuth(requiredPermission?: string): Promise<AuthContext> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.tenantId || !user.role) {
    throw new AppError("Autenticacao obrigatoria.", ErrorCodes.AUTH_UNAUTHORIZED, 401);
  }

  const role = user.role as RoleKey;

  let context: AuthContext = {
    userId: user.id,
    tenantId: user.tenantId,
    role,
    tenantName: user.tenantName,
    tenantStatus: user.tenantStatus,
    tenantOnboardingStatus: user.tenantOnboardingStatus,
    userStatus: user.userStatus,
    isProfileComplete: Boolean(user.isProfileComplete),
  };

  // Session JWT fields can be stale after profile/onboarding updates. Prefer live DB state.
  try {
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
      },
      select: {
        role: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            status: true,
            onboardingStatus: true,
          },
        },
        user: {
          select: {
            status: true,
            isProfileComplete: true,
          },
        },
      },
    });

    if (membership) {
      context = {
        userId: user.id,
        tenantId: membership.tenantId,
        role: membership.role,
        tenantName: membership.tenant.name,
        tenantStatus: membership.tenant.status,
        tenantOnboardingStatus: membership.tenant.onboardingStatus,
        userStatus: membership.user.status,
        isProfileComplete: membership.user.isProfileComplete,
      };
    }
  } catch (error) {
    if (!isInfrastructureUnavailableError(error)) {
      throw error;
    }
  }

  if (requiredPermission) {
    const allowed = await canAccessPermission(context, requiredPermission);

    if (!allowed) {
      throw new AppError("Permissao insuficiente para esta operacao.", ErrorCodes.RBAC_FORBIDDEN, 403);
    }
  }

  return context;
}

export async function requirePageAuth(requiredPermission?: string): Promise<AuthContext> {
  try {
    return await requireAuth(requiredPermission);
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.AUTH_UNAUTHORIZED) {
      redirect("/login");
    }

    throw error;
  }
}
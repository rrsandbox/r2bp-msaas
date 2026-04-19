import bcrypt from "bcryptjs";

import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { prisma } from "@/infra/db/prisma";
import { loginSchema, type LoginInput } from "@/lib/validation/auth/login.schema";

export async function authenticateUser(input: LoginInput) {
  const credentials = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: {
      memberships: {
        include: {
          tenant: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user?.passwordHash) {
    throw new AppError("Credenciais invalidas.", ErrorCodes.AUTH_INVALID_CREDENTIALS, 401);
  }

  if (user.status === "PENDING_APPROVAL") {
    throw new AppError("Seu cadastro ainda aguarda aprovacao.", ErrorCodes.AUTH_PENDING_APPROVAL, 403);
  }

  if (["INACTIVE", "BLOCKED", "DELETED"].includes(user.status)) {
    throw new AppError("Seu acesso esta bloqueado ou inativo.", ErrorCodes.AUTH_BLOCKED, 403);
  }

  const passwordMatches = await bcrypt.compare(credentials.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Credenciais invalidas.", ErrorCodes.AUTH_INVALID_CREDENTIALS, 401);
  }

  const primaryMembership = user.memberships[0];

  if (!primaryMembership) {
    throw new AppError("Usuario sem tenant associado.", ErrorCodes.AUTH_TENANT_REQUIRED, 403);
  }

  if (primaryMembership.tenant.status !== "active") {
    throw new AppError("Tenant aguardando aprovacao ou indisponivel.", ErrorCodes.TENANT_APPROVAL_REQUIRED, 403);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: primaryMembership.role,
    tenantId: primaryMembership.tenantId,
    tenantName: primaryMembership.tenant.name,
    tenantSlug: primaryMembership.tenant.slug,
    tenantStatus: primaryMembership.tenant.status,
    tenantOnboardingStatus: primaryMembership.tenant.onboardingStatus,
    userStatus: user.status,
    isProfileComplete: user.isProfileComplete,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}
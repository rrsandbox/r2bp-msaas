import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Prisma, type RoleKey } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/infra/db/prisma";
import {
  sendAccountConfirmationEmail,
  sendTenantApprovalEmail,
  sendTenantInviteEmail,
  sendTenantRejectionEmail,
} from "@/infra/email/mailer";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { slugify } from "@/lib/utils/slugify";

type Scope = {
  role: RoleKey;
  tenantId: string;
  userId?: string;
};

const tenantRegistrationSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  tenantName: z.string().min(2).max(120).optional(),
  tenantSlug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

const tenantInviteSchema = z.object({
  email: z.email(),
  role: z.enum(["USER"]).default("USER"),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
});

const acceptInviteSchema = z.object({
  token: z.string().min(12),
  name: z.string().min(2).max(120),
  password: z.string().min(8),
});

const userProfileSchema = z.object({
  name: z.string().min(2).max(120),
  profile: z.record(z.string(), z.unknown()),
});

const tenantOnboardingSchema = z.object({
  legalProfile: z.record(z.string(), z.unknown()),
  billingProfile: z.record(z.string(), z.unknown()),
  adminProfile: z.record(z.string(), z.unknown()),
});

async function assertSystemRegistrationApprover(scope: Scope) {
  if (scope.role === "SUPER_ADMIN") {
    return;
  }

  if (scope.role === "ADMIN") {
    const tenant = await prisma.tenant.findUnique({
      where: { id: scope.tenantId },
      select: { slug: true },
    });

    if (tenant?.slug === "sistema") {
      return;
    }
  }

  throw new AppError("Apenas o super usuario do sistema pode executar esta operacao.", ErrorCodes.RBAC_FORBIDDEN, 403);
}

function assertTenantAdmin(scope: Scope) {
  if (!["SUPER_ADMIN", "ADMIN"].includes(scope.role)) {
    throw new AppError("Apenas administradores do tenant podem executar esta operacao.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createTenantLabel(email: string, fallbackName?: string) {
  if (fallbackName) {
    return fallbackName;
  }

  const domain = email.split("@")[1] ?? "tenant";
  return `Tenant ${domain.replace(/\.[a-z]+$/i, "")}`;
}

function toJsonValue(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

async function completeRelatedTasks(requestId: string) {
  await prisma.administrativeTask.updateMany({
    where: {
      status: {
        in: ["OPEN", "IN_PROGRESS"],
      },
      payload: {
        path: ["requestId"],
        equals: requestId,
      },
    },
    data: {
      status: "COMPLETED",
      resolvedAt: new Date(),
    },
  });
}

export async function registerTenantPreSignup(input: unknown) {
  const payload = tenantRegistrationSchema.parse(input);

  const existingPending = await prisma.tenantRegistrationRequest.findFirst({
    where: {
      email: payload.email,
      status: "PENDING_APPROVAL",
    },
    select: { id: true },
  });

  if (existingPending) {
    throw new AppError("Ja existe um pre-cadastro pendente para este e-mail.", ErrorCodes.CONFLICT, 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const request = await prisma.tenantRegistrationRequest.create({
    data: {
      email: payload.email,
      passwordHash,
      requestedTenantName: payload.tenantName,
      requestedTenantSlug: payload.tenantSlug,
    },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  await prisma.administrativeTask.create({
    data: {
      type: "APPROVE_TENANT_REGISTRATION",
      status: "OPEN",
      title: `Aprovar tenant para ${payload.email}`,
      description: "Novo pre-cadastro de tenant aguardando avaliacao do sistema.",
      payload: {
        requestId: request.id,
        email: request.email,
      },
    },
  });

  return request;
}

export async function listTenantRegistrationRequests(scope: Scope) {
  await assertSystemRegistrationApprover(scope);

  return prisma.tenantRegistrationRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });
}

export async function approveTenantRegistration(requestId: string, scope: Scope) {
  await assertSystemRegistrationApprover(scope);

  const request = await prisma.tenantRegistrationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError("Solicitacao de tenant nao encontrada.", ErrorCodes.TENANT_NOT_FOUND, 404);
  }

  if (request.status !== "PENDING_APPROVAL") {
    throw new AppError("Esta solicitacao ja foi processada.", ErrorCodes.CONFLICT, 409);
  }

  const tenantName = createTenantLabel(request.email, request.requestedTenantName ?? undefined);
  const tenantSlug = request.requestedTenantSlug ?? slugify(tenantName);

  const slugOwner = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (slugOwner) {
    throw new AppError("Slug do tenant ja existe.", ErrorCodes.CONFLICT, 409);
  }

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        status: "active",
        approvedAt: new Date(),
        approvedById: scope.userId,
        onboardingStatus: "PENDING",
        settings: {
          create: {},
        },
      },
    });

    const user = await tx.user.create({
      data: {
        email: request.email,
        passwordHash: request.passwordHash,
        status: "ACTIVE",
        isProfileComplete: false,
        memberships: {
          create: {
            tenantId: tenant.id,
            role: "ADMIN",
          },
        },
      },
    });

    await tx.tenantRegistrationRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        tenantId: tenant.id,
        reviewerId: scope.userId,
        reviewedAt: new Date(),
        approvedAt: new Date(),
      },
    });

    await tx.administrativeTask.create({
      data: {
        tenantId: tenant.id,
        type: "REVIEW_TENANT_ONBOARDING",
        status: "OPEN",
        title: `Acompanhar onboarding do tenant ${tenant.name}`,
        description: "Tenant aprovado aguardando conclusao do cadastro administrativo.",
        payload: {
          tenantId: tenant.id,
          adminUserId: user.id,
        },
      },
    });

    return { tenant, user };
  });

  await completeRelatedTasks(requestId);
  await sendTenantApprovalEmail(request.email, result.tenant.name);

  return {
    tenantId: result.tenant.id,
    userId: result.user.id,
    tenantName: result.tenant.name,
  };
}

export async function rejectTenantRegistration(requestId: string, notes: string | undefined, scope: Scope) {
  await assertSystemRegistrationApprover(scope);

  const request = await prisma.tenantRegistrationRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  if (!request) {
    throw new AppError("Solicitacao de tenant nao encontrada.", ErrorCodes.TENANT_NOT_FOUND, 404);
  }

  if (request.status !== "PENDING_APPROVAL") {
    throw new AppError("Esta solicitacao ja foi processada.", ErrorCodes.CONFLICT, 409);
  }

  await prisma.tenantRegistrationRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewNotes: notes,
      reviewerId: scope.userId,
      reviewedAt: new Date(),
      rejectedAt: new Date(),
    },
  });

  await completeRelatedTasks(requestId);
  await sendTenantRejectionEmail(request.email, notes ?? null);
}

export async function listTenantInvites(scope: Scope) {
  assertTenantAdmin(scope);

  return prisma.tenantUserInvite.findMany({
    where: {
      ...(scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
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
  });
}

export async function createTenantInvite(input: unknown, scope: Scope) {
  assertTenantAdmin(scope);

  const payload = tenantInviteSchema.parse(input);
  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + payload.expiresInDays);

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("Ja existe usuario cadastrado com este e-mail.", ErrorCodes.CONFLICT, 409);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: scope.tenantId },
    select: { id: true, name: true },
  });

  if (!tenant) {
    throw new AppError("Tenant nao encontrado.", ErrorCodes.TENANT_NOT_FOUND, 404);
  }

  const invite = await prisma.tenantUserInvite.create({
    data: {
      tenantId: tenant.id,
      email: payload.email,
      role: payload.role,
      tokenHash,
      invitedById: scope.userId ?? "",
      expiresAt,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
    },
  });

  const inviter = scope.userId
    ? await prisma.user.findUnique({
        where: { id: scope.userId },
        select: { name: true },
      })
    : null;

  await sendTenantInviteEmail({
    to: payload.email,
    tenantName: tenant.name,
    inviterName: inviter?.name,
    token,
  });

  return invite;
}

export async function resendTenantInvite(inviteId: string, scope: Scope) {
  assertTenantAdmin(scope);

  const invite = await prisma.tenantUserInvite.findFirst({
    where: {
      id: inviteId,
      ...(scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId }),
    },
    include: {
      tenant: {
        select: {
          name: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite) {
    throw new AppError("Convite nao encontrado.", ErrorCodes.USER_INVITE_NOT_FOUND, 404);
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const updated = await prisma.tenantUserInvite.update({
    where: { id: invite.id },
    data: {
      tokenHash,
      status: "PENDING",
      expiresAt,
      revokedAt: null,
    },
  });

  await sendTenantInviteEmail({
    to: invite.email,
    tenantName: invite.tenant.name,
    inviterName: invite.invitedBy.name,
    token,
  });

  return updated;
}

export async function acceptTenantInvite(input: unknown) {
  const payload = acceptInviteSchema.parse(input);
  const invite = await prisma.tenantUserInvite.findUnique({
    where: {
      tokenHash: hashToken(payload.token),
    },
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

  if (!invite || invite.status !== "PENDING") {
    throw new AppError("Convite invalido ou expirado.", ErrorCodes.USER_INVITE_NOT_FOUND, 404);
  }

  if (invite.expiresAt < new Date()) {
    await prisma.tenantUserInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });

    throw new AppError("Convite invalido ou expirado.", ErrorCodes.USER_INVITE_NOT_FOUND, 404);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("Ja existe usuario cadastrado com este e-mail.", ErrorCodes.CONFLICT, 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: invite.email,
        name: payload.name,
        passwordHash,
        status: "ACTIVE",
        isProfileComplete: false,
        memberships: {
          create: {
            tenantId: invite.tenantId,
            role: invite.role,
          },
        },
      },
    });

    await tx.tenantUserInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedUserId: user.id,
      },
    });

    return user;
  });

  await sendAccountConfirmationEmail(invite.email);

  return {
    userId: result.id,
    tenantSlug: invite.tenant.slug,
  };
}

export async function completeOwnProfile(input: unknown, scope: Scope) {
  const payload = userProfileSchema.parse(input);

  const membership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId: scope.tenantId,
      userId: scope.userId,
    },
    select: { id: true },
  });

  if (!membership || !scope.userId) {
    throw new AppError("Usuario nao encontrado no tenant.", ErrorCodes.USER_NOT_FOUND, 404);
  }

  return prisma.user.update({
    where: { id: scope.userId },
    data: {
      name: payload.name,
      profile: toJsonValue(payload.profile),
      isProfileComplete: true,
      profileCompletedAt: new Date(),
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      isProfileComplete: true,
    },
  });
}

export async function completeTenantOnboarding(input: unknown, scope: Scope) {
  assertTenantAdmin(scope);
  const payload = tenantOnboardingSchema.parse(input);

  return prisma.tenant.update({
    where: { id: scope.tenantId },
    data: {
      legalProfile: toJsonValue(payload.legalProfile),
      billingProfile: toJsonValue(payload.billingProfile),
      adminProfile: toJsonValue(payload.adminProfile),
      onboardingStatus: "COMPLETED",
    },
    select: {
      id: true,
      name: true,
      onboardingStatus: true,
    },
  });
}

export async function requestOwnAccountDeletion(scope: Scope) {
  if (!scope.userId) {
    throw new AppError("Usuario nao autenticado.", ErrorCodes.AUTH_UNAUTHORIZED, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: scope.userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError("Usuario nao encontrado.", ErrorCodes.USER_NOT_FOUND, 404);
  }

  const anonymizedEmail = `deleted+${user.id}@anon.r2bp.local`;

  return prisma.user.update({
    where: { id: user.id },
    data: {
      email: anonymizedEmail,
      name: "Usuario removido",
      passwordHash: null,
      status: "DELETED",
      deactivatedAt: new Date(),
      anonymizedAt: new Date(),
      profile: toJsonValue({
        anonymizedFrom: user.email,
      }),
      isProfileComplete: false,
    },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });
}
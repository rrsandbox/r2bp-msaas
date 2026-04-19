import { type RoleKey } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { sendTwoFactorCodeEmail } from "@/infra/email/mailer";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";

const TWO_FACTOR_SCOPE = "auth:2fa-ticket";

type TwoFactorTicketPayload = {
  userId: string;
  email: string;
  name: string | null;
  role: RoleKey;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantStatus: string;
  tenantOnboardingStatus: string;
  userStatus: string;
  isProfileComplete: boolean;
  verified: boolean;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: RoleKey;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantStatus: string;
  tenantOnboardingStatus: string;
  userStatus: string;
  isProfileComplete: boolean;
};

async function hashCode(code: string) {
  const encoded = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeCode(code: string) {
  return code.replace(/\D/g, "");
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function parseTicketPayload(value: unknown): TwoFactorTicketPayload {
  if (!value || typeof value !== "object") {
    throw new AppError("Ticket 2FA invalido.", ErrorCodes.AUTH_2FA_TICKET_INVALID, 401);
  }

  const payload = value as Partial<TwoFactorTicketPayload>;

  if (
    !payload.userId ||
    !payload.email ||
    !payload.role ||
    !payload.tenantId ||
    !payload.tenantName ||
    !payload.tenantSlug ||
    !payload.tenantStatus ||
    !payload.tenantOnboardingStatus ||
    !payload.userStatus ||
    typeof payload.isProfileComplete !== "boolean" ||
    typeof payload.verified !== "boolean"
  ) {
    throw new AppError("Ticket 2FA invalido.", ErrorCodes.AUTH_2FA_TICKET_INVALID, 401);
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name ?? null,
    role: payload.role,
    tenantId: payload.tenantId,
    tenantName: payload.tenantName,
    tenantSlug: payload.tenantSlug,
    tenantStatus: payload.tenantStatus,
    tenantOnboardingStatus: payload.tenantOnboardingStatus,
    userStatus: payload.userStatus,
    isProfileComplete: payload.isProfileComplete,
    verified: payload.verified,
  };
}

export async function createTwoFactorChallenge(user: AuthenticatedUser) {
  const settings = await prisma.tenantSetting.findUnique({
    where: {
      tenantId: user.tenantId,
    },
    select: {
      twoFactorTtl: true,
    },
  });

  const ttlMinutes = settings?.twoFactorTtl ?? 10;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const code = generateCode();
  const ticket = crypto.randomUUID();
  const codeHash = await hashCode(code);

  await prisma.twoFactorCode.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      codeHash,
      expiresAt,
    },
  });

  await prisma.keyValueEntry.create({
    data: {
      tenantId: user.tenantId,
      scope: TWO_FACTOR_SCOPE,
      key: ticket,
      value: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenantName,
        tenantSlug: user.tenantSlug,
        tenantStatus: user.tenantStatus,
        tenantOnboardingStatus: user.tenantOnboardingStatus,
        userStatus: user.userStatus,
        isProfileComplete: user.isProfileComplete,
        verified: false,
      },
      expiresAt,
    },
  });

  await sendTwoFactorCodeEmail(user.email, code, ttlMinutes);

  return {
    ticket,
    ttlMinutes,
  };
}

export async function verifyTwoFactorCode(ticket: string, code: string) {
  const ticketRecord = await prisma.keyValueEntry.findFirst({
    where: {
      scope: TWO_FACTOR_SCOPE,
      key: ticket,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!ticketRecord) {
    throw new AppError("Sessao 2FA expirada. Faca login novamente.", ErrorCodes.AUTH_2FA_TICKET_EXPIRED, 401);
  }

  const payload = parseTicketPayload(ticketRecord.value);

  const activeCode = await prisma.twoFactorCode.findFirst({
    where: {
      tenantId: payload.tenantId,
      userId: payload.userId,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const normalizedCode = normalizeCode(code);

  if (normalizedCode.length !== 6) {
    throw new AppError("Codigo 2FA invalido.", ErrorCodes.AUTH_2FA_CODE_INVALID, 401);
  }

  const providedCodeHash = await hashCode(normalizedCode);

  if (!activeCode || activeCode.codeHash !== providedCodeHash) {
    throw new AppError("Codigo 2FA invalido.", ErrorCodes.AUTH_2FA_CODE_INVALID, 401);
  }

  await prisma.twoFactorCode.update({
    where: {
      id: activeCode.id,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  await prisma.keyValueEntry.update({
    where: {
      tenantId_scope_key: {
        tenantId: ticketRecord.tenantId,
        scope: TWO_FACTOR_SCOPE,
        key: ticket,
      },
    },
    data: {
      value: {
        ...payload,
        verified: true,
      },
    },
  });

  return payload;
}

export async function consumeTwoFactorTicket(ticket: string): Promise<AuthenticatedUser> {
  const ticketRecord = await prisma.keyValueEntry.findFirst({
    where: {
      scope: TWO_FACTOR_SCOPE,
      key: ticket,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!ticketRecord) {
    throw new AppError("Ticket 2FA expirado.", ErrorCodes.AUTH_2FA_TICKET_EXPIRED, 401);
  }

  const payload = parseTicketPayload(ticketRecord.value);

  if (!payload.verified) {
    throw new AppError("Codigo 2FA nao verificado.", ErrorCodes.AUTH_2FA_REQUIRED, 401);
  }

  await prisma.keyValueEntry.delete({
    where: {
      tenantId_scope_key: {
        tenantId: ticketRecord.tenantId,
        scope: TWO_FACTOR_SCOPE,
        key: ticket,
      },
    },
  });

  return {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    tenantId: payload.tenantId,
    tenantName: payload.tenantName,
    tenantSlug: payload.tenantSlug,
    tenantStatus: payload.tenantStatus,
    tenantOnboardingStatus: payload.tenantOnboardingStatus,
    userStatus: payload.userStatus,
    isProfileComplete: payload.isProfileComplete,
  };
}
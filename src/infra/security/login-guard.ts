import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 30;

type AttemptKey = {
  email: string;
  ipAddress: string;
};

function normalizeKey(email: string, ipAddress: string): AttemptKey {
  return {
    email: email.trim().toLowerCase(),
    ipAddress: ipAddress.trim() || "unknown",
  };
}

export async function assertLoginAllowed(email: string, ipAddress: string) {
  const key = normalizeKey(email, ipAddress);

  const attempt = await prisma.loginAttempt.findUnique({
    where: {
      email_ipAddress: key,
    },
  });

  const now = new Date();

  if (attempt?.blockedUntil && attempt.blockedUntil > now) {
    throw new AppError("Tentativas excedidas. Tente novamente mais tarde.", ErrorCodes.AUTH_BLOCKED, 429);
  }

  if (attempt?.expiresAt && attempt.expiresAt <= now) {
    await prisma.loginAttempt.delete({
      where: {
        email_ipAddress: key,
      },
    });
  }
}

export async function registerLoginFailure(email: string, ipAddress: string) {
  const key = normalizeKey(email, ipAddress);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);

  const current = await prisma.loginAttempt.findUnique({
    where: {
      email_ipAddress: key,
    },
  });

  const baseAttempts = current && current.expiresAt > now ? current.attempts : 0;
  const attempts = baseAttempts + 1;

  const blockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MINUTES * 60 * 1000) : null;

  await prisma.loginAttempt.upsert({
    where: {
      email_ipAddress: key,
    },
    update: {
      attempts,
      blockedUntil,
      expiresAt,
    },
    create: {
      ...key,
      attempts,
      blockedUntil,
      expiresAt,
    },
  });
}

export async function clearLoginFailures(email: string, ipAddress: string) {
  const key = normalizeKey(email, ipAddress);

  await prisma.loginAttempt.deleteMany({
    where: key,
  });
}
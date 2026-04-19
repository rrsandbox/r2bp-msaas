import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";

import { prisma } from "@/infra/db/prisma";
import { sendPasswordResetEmail } from "@/infra/email/mailer";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { passwordSchema } from "@/lib/validation/auth/password.schema";

const requestSchema = z.object({
  email: z.email(),
});

const resetSchema = z.object({
  token: z.string().min(12),
  password: passwordSchema,
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(input: unknown) {
  const payload = requestSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      email: true,
      status: true,
    },
  });

  if (!user || user.status === "DELETED") {
    return { accepted: true };
  }

  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: payload.email,
      expires: {
        gt: new Date(),
      },
    },
    select: {
      token: true,
    },
  });

  if (existingToken) {
    return { accepted: true };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.verificationToken.deleteMany({
    where: { identifier: payload.email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: payload.email,
      token: tokenHash,
      expires,
    },
  });

  await sendPasswordResetEmail(payload.email, token);

  return { accepted: true };
}

export async function resetPassword(input: unknown) {
  const payload = resetSchema.parse(input);
  const tokenHash = hashToken(payload.token);
  const token = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!token || token.expires < new Date()) {
    throw new AppError("Token de redefinicao invalido ou expirado.", ErrorCodes.AUTH_INVALID_CREDENTIALS, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: token.identifier },
    select: {
      status: true,
    },
  });

  if (!user || user.status === "DELETED" || user.status === "BLOCKED") {
    throw new AppError("Token de redefinicao invalido ou expirado.", ErrorCodes.AUTH_INVALID_CREDENTIALS, 400);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: token.identifier },
      data: {
        passwordHash,
      },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: token.identifier,
          token: token.token,
        },
      },
    }),
  ]);

  return { reset: true };
}
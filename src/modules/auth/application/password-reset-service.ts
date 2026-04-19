import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";

import { prisma } from "@/infra/db/prisma";
import { sendPasswordResetEmail } from "@/infra/email/mailer";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";

const requestSchema = z.object({
  email: z.email(),
});

const resetSchema = z.object({
  token: z.string().min(12),
  password: z.string().min(8),
});

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

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.verificationToken.deleteMany({
    where: { identifier: payload.email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: payload.email,
      token,
      expires,
    },
  });

  await sendPasswordResetEmail(payload.email, token);

  return { accepted: true };
}

export async function resetPassword(input: unknown) {
  const payload = resetSchema.parse(input);
  const token = await prisma.verificationToken.findUnique({
    where: { token: payload.token },
  });

  if (!token || token.expires < new Date()) {
    throw new AppError("Token de redefinicao invalido ou expirado.", ErrorCodes.AUTH_INVALID_CREDENTIALS, 400);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: token.identifier },
      data: {
        passwordHash,
        status: "ACTIVE",
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
import { createHash } from "crypto";

import { prisma } from "@/infra/db/prisma";

export function buildBrowserFingerprint(headers: Headers) {
  const userAgent = headers.get("user-agent") ?? "unknown";
  const acceptLanguage = headers.get("accept-language") ?? "unknown";
  const forwardedFor = headers.get("x-forwarded-for") ?? "unknown";

  return createHash("sha256").update(`${userAgent}|${acceptLanguage}|${forwardedFor}`).digest("hex");
}

export async function isTrustedBrowser(tenantId: string, userId: string, fingerprint: string) {
  const browser = await prisma.trustedBrowser.findUnique({
    where: {
      tenantId_userId_fingerprint: {
        tenantId,
        userId,
        fingerprint,
      },
    },
  });

  return Boolean(browser && browser.expiresAt > new Date());
}

export async function rememberTrustedBrowser(
  tenantId: string,
  userId: string,
  fingerprint: string,
  ttlDays: number,
) {
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.trustedBrowser.upsert({
    where: {
      tenantId_userId_fingerprint: {
        tenantId,
        userId,
        fingerprint,
      },
    },
    update: {
      expiresAt,
    },
    create: {
      tenantId,
      userId,
      fingerprint,
      expiresAt,
    },
  });
}
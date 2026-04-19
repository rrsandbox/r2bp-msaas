"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth/auth";
import { handleServerActionError } from "@/lib/errors/server-action";
import { prisma } from "@/infra/db/prisma";
import { verifyTwoFactorCode } from "@/modules/auth/application/two-factor";
import { buildBrowserFingerprint, rememberTrustedBrowser } from "@/modules/auth/application/trusted-browser";

const PENDING_TICKET_COOKIE = "pending_2fa_ticket";

export async function verifyTwoFactorAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const shouldTrustBrowser = String(formData.get("trustedBrowser") ?? "no") === "yes";
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  if (!code) {
    redirect("/2fa?error=Informe%20o%20codigo%20de%20verificacao");
  }

  const cookieStore = await cookies();
  const ticket = cookieStore.get(PENDING_TICKET_COOKIE)?.value;

  if (!ticket) {
    redirect("/login?error=Sessao%202FA%20expirada");
  }

  try {
    const payload = await verifyTwoFactorCode(ticket, code);

    if (shouldTrustBrowser) {
      const fingerprint = buildBrowserFingerprint(requestHeaders);
      const settings = await prisma.tenantSetting.findUnique({
        where: {
          tenantId: payload.tenantId,
        },
        select: {
          trustedTtlDays: true,
        },
      });

      await rememberTrustedBrowser(
        payload.tenantId,
        payload.userId,
        fingerprint,
        settings?.trustedTtlDays ?? 30,
      );
    }

    cookieStore.delete(PENDING_TICKET_COOKIE);

    await signIn("credentials", {
      twoFactorTicket: ticket,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "auth.two-factor.verify",
      redirectTo: "/2fa",
      requestId,
    });
  }
}
"use server";

import { AuthError } from "next-auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth/auth";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { handleServerActionError } from "@/lib/errors/server-action";
import { clearLoginFailures, assertLoginAllowed, registerLoginFailure } from "@/infra/security/login-guard";
import { authenticateUser } from "@/modules/auth/application/authenticate-user";
import { createTwoFactorChallenge } from "@/modules/auth/application/two-factor";
import { buildBrowserFingerprint, isTrustedBrowser } from "@/modules/auth/application/trusted-browser";

const PENDING_TICKET_COOKIE = "pending_2fa_ticket";

function extractClientIp(requestHeaders: Headers) {
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Credenciais%20invalidas");
  }

  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const ipAddress = extractClientIp(requestHeaders);

  try {
    await assertLoginAllowed(email, ipAddress);

    const user = await authenticateUser({ email, password });
    const fingerprint = buildBrowserFingerprint(requestHeaders);

    const browserTrusted = user.twoFactorEnabled
      ? await isTrustedBrowser(user.tenantId, user.id, fingerprint)
      : false;

    if (user.twoFactorEnabled && !browserTrusted) {
      const challenge = await createTwoFactorChallenge({
        id: user.id,
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
      });

      const cookieStore = await cookies();
      cookieStore.set(PENDING_TICKET_COOKIE, challenge.ticket, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: challenge.ttlMinutes * 60,
      });

      await clearLoginFailures(email, ipAddress);

      redirect("/2fa");
    }

    await clearLoginFailures(email, ipAddress);

    const redirectTo = user.role === "USER" ? "/dashboard" : "/tenants";

    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    const digest = (error as { digest?: string })?.digest ?? "";
    if (digest.startsWith("NEXT_REDIRECT")) throw error;

    if (error instanceof AuthError) {
      await handleServerActionError({
        error,
        operation: "auth.login.signin",
        redirectTo: "/login",
        requestId,
        beforeRedirect: async () => {
          await registerLoginFailure(email, ipAddress);
        },
      });
    }

    await handleServerActionError({
      error,
      operation: "auth.login",
      redirectTo: "/login",
      requestId,
      beforeRedirect: async (errorCode) => {
        if (errorCode === ErrorCodes.AUTH_INVALID_CREDENTIALS || errorCode === ErrorCodes.AUTH_FAILURE) {
          await registerLoginFailure(email, ipAddress);
        }
      },
    });
  }
}
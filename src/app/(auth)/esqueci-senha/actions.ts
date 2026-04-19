"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { handleServerActionError } from "@/lib/errors/server-action";
import { requestPasswordReset } from "@/modules/auth/application/password-reset-service";

export async function requestPasswordResetAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    await requestPasswordReset({
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
    });

    redirect("/login?success=password-reset-requested");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "auth.password-reset.request",
      redirectTo: "/esqueci-senha",
      requestId,
    });
  }
}
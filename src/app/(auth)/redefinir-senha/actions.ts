"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { handleServerActionError } from "@/lib/errors/server-action";
import { resetPassword } from "@/modules/auth/application/password-reset-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function resetPasswordAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const token = readText(formData, "token");

  try {
    await resetPassword({
      token,
      password: readText(formData, "password"),
    });

    redirect("/login?success=password-reset-done");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "auth.password-reset.complete",
      redirectTo: `/redefinir-senha?token=${encodeURIComponent(token)}`,
      requestId,
    });
  }
}
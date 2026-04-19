"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { handleServerActionError } from "@/lib/errors/server-action";
import { acceptTenantInvite } from "@/modules/auth/application/tenant-onboarding-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function acceptTenantInviteAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    await acceptTenantInvite({
      token: readText(formData, "token"),
      name: readText(formData, "name"),
      password: readText(formData, "password"),
    });

    redirect("/login?success=invite-accepted");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.invite.accept",
      redirectTo: `/cadastro-convite?token=${encodeURIComponent(readText(formData, "token"))}`,
      requestId,
    });
  }
}
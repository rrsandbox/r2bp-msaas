"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { handleServerActionError } from "@/lib/errors/server-action";
import { registerTenantPreSignup } from "@/modules/auth/application/tenant-onboarding-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function registerTenantPreSignupAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    await registerTenantPreSignup({
      email: readText(formData, "email").toLowerCase(),
      password: readText(formData, "password"),
      tenantName: readText(formData, "tenantName") || undefined,
      tenantSlug: readText(formData, "tenantSlug") || undefined,
    });

    redirect("/?success=tenant-requested");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.preregistration.create",
      redirectTo: "/cadastro-tenant",
      requestId,
    });
  }
}
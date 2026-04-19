"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signOut } from "@/lib/auth/auth";
import { requireAuth } from "@/lib/auth/authorization";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import {
  completeOwnProfile,
  completeTenantOnboarding,
  requestOwnAccountDeletion,
} from "@/modules/auth/application/tenant-onboarding-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readProfilePayload(formData: FormData) {
  const personType = readText(formData, "personType") === "PJ" ? "PJ" : "PF";

  if (personType === "PJ") {
    return {
      personType,
      companyName: readText(formData, "companyName"),
      tradeName: readText(formData, "tradeName"),
      companyDocumentNumber: readText(formData, "companyDocumentNumber"),
      responsibleFullName: readText(formData, "responsibleFullName"),
      responsibleIdentity: readText(formData, "responsibleIdentity"),
      responsibleCpf: readText(formData, "responsibleCpf"),
      responsibleEmail: readText(formData, "responsibleEmail"),
      responsiblePhone: readText(formData, "responsiblePhone"),
      legalEntityBankName: readText(formData, "legalEntityBankName"),
      legalEntityBankAgency: readText(formData, "legalEntityBankAgency"),
      legalEntityBankAccount: readText(formData, "legalEntityBankAccount"),
      legalEntityPixKey: readText(formData, "legalEntityPixKey"),
    };
  }

  return {
    personType,
    documentNumber: readText(formData, "documentNumber"),
    identityNumber: readText(formData, "identityNumber"),
    cpf: readText(formData, "cpf"),
    phone: readText(formData, "phone"),
    address: readText(formData, "address"),
    city: readText(formData, "city"),
    state: readText(formData, "state"),
    zipCode: readText(formData, "zipCode"),
    birthDate: readText(formData, "birthDate"),
    occupation: readText(formData, "occupation"),
    monthlyIncome: readText(formData, "monthlyIncome"),
    personalBankName: readText(formData, "personalBankName"),
    personalBankAgency: readText(formData, "personalBankAgency"),
    personalBankAccount: readText(formData, "personalBankAccount"),
    personalPixKey: readText(formData, "personalPixKey"),
  };
}

function withSuccessMessage(pathname: string, successCode: string) {
  const target = new URL(pathname, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}` as Route;
}

export async function completeProfileAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("profile:update");
    const payload = {
      name: readText(formData, "name"),
      profile: readProfilePayload(formData),
    };

    await completeOwnProfile(payload, context);

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "PROFILE_COMPLETED",
      resource: "user-profile",
    });

    revalidatePath("/perfil");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage("/perfil", "profile"));
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "profile.complete",
      redirectTo: "/perfil",
      requestId,
    });
  }
}

export async function completeTenantOnboardingAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("tenant:onboarding");

    await completeTenantOnboarding(
      {
        legalProfile: {
          entityType: readText(formData, "entityType"),
          legalName: readText(formData, "legalName"),
          tradeName: readText(formData, "tradeName"),
          documentNumber: readText(formData, "tenantDocumentNumber"),
          representativeName: readText(formData, "representativeName"),
          representativeEmail: readText(formData, "representativeEmail"),
        },
        billingProfile: {
          billingEmail: readText(formData, "billingEmail"),
          billingPhone: readText(formData, "billingPhone"),
          bankName: readText(formData, "bankName"),
          pixKey: readText(formData, "pixKey"),
        },
        adminProfile: {
          supportEmail: readText(formData, "supportEmail"),
          supportPhone: readText(formData, "supportPhone"),
          notes: readText(formData, "notes"),
        },
      },
      context,
    );

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_ONBOARDING_COMPLETED",
      resource: "tenant",
    });

    revalidatePath("/perfil");
    revalidatePath("/dashboard");
    revalidatePath("/tenants");
    redirect(withSuccessMessage("/perfil", "tenant"));
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.onboarding.complete",
      redirectTo: "/perfil",
      requestId,
    });
  }
}

export async function requestAccountDeletionAction() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("profile:update");

    await requestOwnAccountDeletion(context);

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "ACCOUNT_DELETION_REQUESTED",
      resource: "user",
      severity: "CRITICAL",
    });

    await signOut({ redirectTo: "/login?success=account-deleted" });
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "profile.delete-account",
      redirectTo: "/perfil",
      requestId,
    });
  }
}
"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { createTenant, deleteTenant, updateTenant } from "@/modules/tenant/application/tenant-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function buildTenantProfilesFromForm(formData: FormData) {
  const personType = readText(formData, "personType") === "PJ" ? "PJ" : "PF";

  const legalProfile =
    personType === "PF"
      ? {
          personType: "PF" as const,
          qualification: {
            fullName: readText(formData, "pfFullName"),
            document: {
              type: "CPF" as const,
              number: digitsOnly(readText(formData, "pfCpf")),
            },
            birthDate: readText(formData, "pfBirthDate"),
            email: readText(formData, "pfEmail").toLowerCase(),
            phone: readText(formData, "pfPhone"),
            occupation: readText(formData, "pfOccupation"),
            identityDocument: readText(formData, "pfIdentityDocument") || undefined,
          },
        }
      : {
          personType: "PJ" as const,
          qualification: {
            corporateName: readText(formData, "pjCorporateName"),
            tradeName: readText(formData, "pjTradeName") || undefined,
            document: {
              type: "CNPJ" as const,
              number: digitsOnly(readText(formData, "pjCnpj")),
            },
            email: readText(formData, "pjEmail").toLowerCase(),
            phone: readText(formData, "pjPhone"),
            mainActivity: readText(formData, "pjMainActivity"),
          },
          legalRepresentative: {
            fullName: readText(formData, "repFullName"),
            document: {
              type: "CPF" as const,
              number: digitsOnly(readText(formData, "repCpf")),
            },
            birthDate: readText(formData, "repBirthDate"),
            email: readText(formData, "repEmail").toLowerCase(),
            phone: readText(formData, "repPhone"),
            occupation: readText(formData, "repOccupation"),
            identityDocument: readText(formData, "repIdentityDocument") || undefined,
          },
        };

  const adminProfile =
    personType === "PF"
      ? {
          personType: "PF",
          ...legalProfile.qualification,
        }
      : {
          personType: "PF",
          ...legalProfile.legalRepresentative,
        };

  const billingProfile = {
    contactEmail: legalProfile.qualification.email,
    contactPhone: legalProfile.qualification.phone,
    personType,
  };

  return {
    legalProfile,
    adminProfile,
    billingProfile,
  };
}

function readReturnTo(formData: FormData) {
  const candidate = readText(formData, "returnTo");

  if (candidate.startsWith("/tenants")) {
    return candidate;
  }

  return "/tenants";
}

function withSuccessMessage(returnTo: string, successCode: "created" | "updated" | "deleted") {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}`;
}

export async function createTenantAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("tenant:update");
    if (context.role !== "SUPER_ADMIN") {
      throw new AppError("Apenas o super usuario do sistema pode criar tenants.", ErrorCodes.RBAC_FORBIDDEN, 403);
    }

    const name = readText(formData, "name");
    const slug = readText(formData, "slug");
    const { legalProfile, adminProfile, billingProfile } = buildTenantProfilesFromForm(formData);

    const tenant = await createTenant({
      name,
      slug: slug || undefined,
      legalProfile,
      adminProfile,
      billingProfile,
    });

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_CREATED",
      resource: "tenant",
      payload: {
        createdTenantId: tenant.id,
        createdTenantSlug: tenant.slug,
      },
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "created") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.page.create",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function updateTenantAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("tenant:update");
    const tenantId = readText(formData, "tenantId");
    const name = readText(formData, "name");
    const slug = readText(formData, "slug");
    const status = readText(formData, "status");
    const shouldUpdateProfiles = Boolean(readText(formData, "personType"));

    const profilePayload = shouldUpdateProfiles
      ? buildTenantProfilesFromForm(formData)
      : undefined;

    const tenant = await updateTenant(
      tenantId,
      {
        name: name || undefined,
        slug: slug || undefined,
        status: status ? (status as "active" | "inactive" | "archived") : undefined,
        legalProfile: profilePayload?.legalProfile,
        adminProfile: profilePayload?.adminProfile,
        billingProfile: profilePayload?.billingProfile,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
      },
    );

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_UPDATED",
      resource: "tenant",
      payload: {
        tenantId: tenant.id,
      },
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "updated") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.page.update",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function deleteTenantAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("tenant:update");
    const tenantId = readText(formData, "tenantId");

    await deleteTenant(tenantId, {
      role: context.role,
      tenantId: context.tenantId,
    });

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "TENANT_DELETED",
      resource: "tenant",
      payload: {
        tenantId,
      },
      severity: "CRITICAL",
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    redirect(withSuccessMessage(returnTo, "deleted") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "tenant.page.delete",
      redirectTo: returnTo,
      requestId,
    });
  }
}

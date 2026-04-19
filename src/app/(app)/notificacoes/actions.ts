"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/infra/db/prisma";
import { requireAuth } from "@/lib/auth/authorization";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import { handleServerActionError } from "@/lib/errors/server-action";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createNoticeAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("notice:read");

    if (context.role !== "SUPER_ADMIN") {
      throw new AppError("Apenas o super usuario do sistema pode publicar avisos globais.", ErrorCodes.RBAC_FORBIDDEN, 403);
    }

    await prisma.systemNotice.create({
      data: {
        title: readText(formData, "title"),
        message: readText(formData, "message"),
        tenantId: readText(formData, "scope") === "tenant" ? context.tenantId : null,
      },
    });

    revalidatePath("/notificacoes");
    revalidatePath("/dashboard");
    redirect("/notificacoes?success=created");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "notice.create",
      redirectTo: "/notificacoes",
      requestId,
    });
  }
}
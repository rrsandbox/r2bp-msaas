"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { handleServerActionError } from "@/lib/errors/server-action";
import { createSupportTicket, updateSupportTicket } from "@/modules/support/application/support-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createSupportTicketAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("support:write");

    await createSupportTicket(
      {
        subject: readText(formData, "subject"),
        description: readText(formData, "description"),
        priority: readText(formData, "priority") || "MEDIUM",
      },
      {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      },
    );

    revalidatePath("/suporte");
    revalidatePath("/dashboard");
    redirect("/suporte?success=created");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "support.ticket.create",
      redirectTo: "/suporte",
      requestId,
    });
  }
}

export async function updateSupportTicketAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  try {
    const context = await requireAuth("support:read");

    await updateSupportTicket(
      readText(formData, "ticketId"),
      {
        status: readText(formData, "status") || undefined,
        priority: readText(formData, "priority") || undefined,
        resolution: readText(formData, "resolution") || undefined,
        assigneeId: readText(formData, "assigneeId") || undefined,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      },
    );

    revalidatePath("/suporte");
    revalidatePath("/dashboard");
    redirect("/suporte?success=updated");
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "support.ticket.update",
      redirectTo: "/suporte",
      requestId,
    });
  }
}
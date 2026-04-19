"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/authorization";
import { handleServerActionError } from "@/lib/errors/server-action";
import { recordAuditEvent } from "@/modules/audit/application/audit-service";
import { ensureCalendarSyncToken } from "@/modules/agenda/application/agenda-sync";
import { createAgendaEvent, deleteAgendaEvent, updateAgendaEvent } from "@/modules/agenda/application/agenda-service";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readReturnTo(formData: FormData) {
  const candidate = readText(formData, "returnTo");

  if (candidate.startsWith("/agenda")) {
    return candidate;
  }

  return "/agenda";
}

function withSuccessMessage(returnTo: string, successCode: "created" | "updated" | "deleted") {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("success", successCode);
  target.searchParams.delete("error");
  return `${target.pathname}${target.search}`;
}

export async function createAgendaEventAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("agenda:write");

    const title = readText(formData, "title");
    const description = readText(formData, "description");
    const startsAt = readText(formData, "startsAt");
    const endsAt = readText(formData, "endsAt");
    const recurrenceFrequency = readText(formData, "recurrenceFrequency");
    const recurrenceInterval = readText(formData, "recurrenceInterval");
    const recurrenceUntil = readText(formData, "recurrenceUntil");
    const recurrenceCount = readText(formData, "recurrenceCount");

    const event = await createAgendaEvent(
      {
        title,
        description: description || undefined,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        recurrenceFrequency: recurrenceFrequency ? (recurrenceFrequency as "DAILY" | "WEEKLY" | "MONTHLY") : undefined,
        recurrenceInterval: recurrenceInterval ? Number(recurrenceInterval) : undefined,
        recurrenceUntil: recurrenceUntil ? new Date(`${recurrenceUntil}T23:59:59.999`) : undefined,
        recurrenceCount: recurrenceCount ? Number(recurrenceCount) : undefined,
      },
      {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      },
    );

    await recordAuditEvent({
      tenantId: event.tenantId,
      userId: context.userId,
      action: "AGENDA_EVENT_CREATED",
      resource: "agenda",
      payload: {
        eventId: event.id,
        ownerId: event.ownerId,
      },
    });

    revalidatePath("/agenda");
    redirect(withSuccessMessage(returnTo, "created") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "agenda.page.create",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function deleteAgendaEventAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("agenda:write");
    const eventId = readText(formData, "eventId");

    await deleteAgendaEvent(eventId, {
      role: context.role,
      tenantId: context.tenantId,
      userId: context.userId,
    });

    await recordAuditEvent({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "AGENDA_EVENT_DELETED",
      resource: "agenda",
      payload: {
        eventId,
      },
      severity: "CRITICAL",
    });

    revalidatePath("/agenda");
    redirect(withSuccessMessage(returnTo, "deleted") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "agenda.page.delete",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function updateAgendaEventAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("agenda:write");
    const eventId = readText(formData, "eventId");
    const title = readText(formData, "title");
    const description = readText(formData, "description");
    const startsAt = readText(formData, "startsAt");
    const endsAt = readText(formData, "endsAt");

    const event = await updateAgendaEvent(
      eventId,
      {
        title,
        description: description || undefined,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
      {
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      },
    );

    await recordAuditEvent({
      tenantId: event.tenantId,
      userId: context.userId,
      action: "AGENDA_EVENT_UPDATED",
      resource: "agenda",
      payload: {
        eventId,
      },
    });

    revalidatePath("/agenda");
    redirect(withSuccessMessage(returnTo, "updated") as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "agenda.page.update",
      redirectTo: returnTo,
      requestId,
    });
  }
}

export async function ensureAgendaSyncTokenAction(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;
  const returnTo = readReturnTo(formData);

  try {
    const context = await requireAuth("agenda:read");
    await ensureCalendarSyncToken(context.userId);

    revalidatePath("/agenda");
    const target = new URL(returnTo, "http://localhost");
    target.searchParams.set("success", "sync-enabled");
    target.searchParams.delete("error");
    redirect(`${target.pathname}${target.search}` as Route);
  } catch (error) {
    await handleServerActionError({
      error,
      operation: "agenda.page.sync-token",
      redirectTo: returnTo,
      requestId,
    });
  }
}

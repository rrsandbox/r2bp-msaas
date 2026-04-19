import crypto from "node:crypto";

import { prisma } from "@/infra/db/prisma";

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDateTime(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function ensureCalendarSyncToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      calendarSyncToken: true,
    },
  });

  if (user?.calendarSyncToken) {
    return user.calendarSyncToken;
  }

  const calendarSyncToken = crypto.randomBytes(24).toString("hex");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { calendarSyncToken },
    select: { calendarSyncToken: true },
  });

  return updated.calendarSyncToken ?? calendarSyncToken;
}

export async function getCalendarSyncToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { calendarSyncToken: true },
  });

  return user?.calendarSyncToken ?? null;
}

export async function buildAgendaIcsFeed(token: string) {
  const user = await prisma.user.findUnique({
    where: { calendarSyncToken: token },
    select: {
      id: true,
      email: true,
      name: true,
      agendas: {
        orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          updatedAt: true,
          tenant: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//R2BP//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(`Agenda ${user.name ?? user.email}`)}`,
  ];

  for (const event of user.agendas) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@r2bp.local`,
      `DTSTAMP:${toIcsDateTime(event.updatedAt)}`,
      `DTSTART:${toIcsDateTime(event.startsAt)}`,
      `DTEND:${toIcsDateTime(event.endsAt)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(event.description ?? "Sem descricao")}`,
      `CATEGORIES:${escapeIcsText(event.tenant.name)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return {
    fileName: `agenda-${user.id}.ics`,
    content: `${lines.join("\r\n")}\r\n`,
  };
}
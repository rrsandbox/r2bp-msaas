import crypto from "node:crypto";

import { prisma } from "@/infra/db/prisma";

const CALENDAR_SYNC_SCOPE = "agenda:calendar-sync-token";

function hashCalendarSyncToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseCalendarSyncPayload(value: unknown): { token?: string } {
  if (!value || typeof value !== "object") {
    return {};
  }

  const payload = value as { token?: unknown };
  return {
    token: typeof payload.token === "string" ? payload.token : undefined,
  };
}

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
      id: true,
      calendarSyncToken: true,
      memberships: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          tenantId: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return null;
  }

  const tenantId = user.memberships[0]?.tenantId;

  if (!tenantId) {
    return null;
  }

  const storedEntry = await prisma.keyValueEntry.findUnique({
    where: {
      tenantId_scope_key: {
        tenantId,
        scope: CALENDAR_SYNC_SCOPE,
        key: user.id,
      },
    },
    select: {
      value: true,
    },
  });

  const storedRawToken = parseCalendarSyncPayload(storedEntry?.value).token;

  if (storedRawToken && user.calendarSyncToken === hashCalendarSyncToken(storedRawToken)) {
    return storedRawToken;
  }

  if (user.calendarSyncToken && !storedRawToken) {
    const legacyRawToken = user.calendarSyncToken;

    await prisma.$transaction([
      prisma.keyValueEntry.upsert({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: CALENDAR_SYNC_SCOPE,
            key: user.id,
          },
        },
        update: {
          value: { token: legacyRawToken },
        },
        create: {
          tenantId,
          scope: CALENDAR_SYNC_SCOPE,
          key: user.id,
          value: { token: legacyRawToken },
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          calendarSyncToken: hashCalendarSyncToken(legacyRawToken),
        },
      }),
    ]);

    return legacyRawToken;
  }

  const calendarSyncToken = crypto.randomBytes(24).toString("hex");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { calendarSyncToken: hashCalendarSyncToken(calendarSyncToken) },
    }),
    prisma.keyValueEntry.upsert({
      where: {
        tenantId_scope_key: {
          tenantId,
          scope: CALENDAR_SYNC_SCOPE,
          key: user.id,
        },
      },
      update: {
        value: { token: calendarSyncToken },
      },
      create: {
        tenantId,
        scope: CALENDAR_SYNC_SCOPE,
        key: user.id,
        value: { token: calendarSyncToken },
      },
    }),
  ]);

  return calendarSyncToken;
}

export async function getCalendarSyncToken(userId: string) {
  return ensureCalendarSyncToken(userId);
}

export async function buildAgendaIcsFeed(token: string) {
  const hashedToken = hashCalendarSyncToken(token);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ calendarSyncToken: hashedToken }, { calendarSyncToken: token }],
    },
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
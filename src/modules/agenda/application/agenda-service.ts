import crypto from "node:crypto";
import { type Prisma, type RoleKey, type RecurrenceFrequency } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import {
  createAgendaEventSchema,
  type CreateAgendaEventInput,
  updateAgendaEventSchema,
  type UpdateAgendaEventInput,
} from "@/lib/validation/agenda/agenda.schema";
import { buildAgendaOccurrences, formatRecurrenceLabel, hasRecurrence } from "@/modules/agenda/application/agenda-recurrence";

type AgendaScope = {
  role: RoleKey;
  tenantId: string;
  userId: string;
};

type AgendaFilters = {
  startsFrom?: Date;
  startsTo?: Date;
  ownerQuery?: string;
  ownerId?: string;
  query?: string;
};

type AgendaPagination = {
  page?: number;
  pageSize?: number;
};

type AgendaSort = {
  startsAt?: "asc" | "desc";
};

type AgendaListResult = {
  items: Array<{
    id: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    ownerId: string;
    ownerName: string | null;
    ownerEmail: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    seriesId: string | null;
    recurrenceFrequency: RecurrenceFrequency | null;
    recurrenceInterval: number | null;
    recurrenceUntil: Date | null;
    recurrenceCount: number | null;
    isRecurringRoot: boolean;
    recurrenceLabel: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function normalizePagination(pagination?: AgendaPagination) {
  const rawPage = pagination?.page ?? 1;
  const rawPageSize = pagination?.pageSize ?? 10;

  const safeRawPage = Number.isFinite(rawPage) ? rawPage : 1;
  const safeRawPageSize = Number.isFinite(rawPageSize) ? rawPageSize : 10;

  const page = Math.max(1, Math.trunc(safeRawPage));
  const pageSize = Math.min(500, Math.max(1, Math.trunc(safeRawPageSize)));

  return {
    page,
    pageSize,
  };
}

function normalizeSort(sort?: AgendaSort) {
  return {
    startsAt: sort?.startsAt === "desc" ? "desc" : "asc",
  } as const;
}

function canManageEvent(scope: AgendaScope, tenantId: string, ownerId: string) {
  if (scope.role === "SUPER_ADMIN") return true;
  if (scope.role === "ADMIN") return scope.tenantId === tenantId;
  return scope.tenantId === tenantId && scope.userId === ownerId;
}

async function ensureTenantMembership(userId: string, tenantId: string) {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new AppError("Responsavel nao pertence ao tenant informado.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }
}

async function assertNoAgendaConflict(params: {
  tenantId: string;
  ownerId: string;
  startsAt: Date;
  endsAt: Date;
  excludeEventIds?: string[];
}) {
  const conflict = await prisma.agendaEvent.findFirst({
    where: {
      tenantId: params.tenantId,
      ownerId: params.ownerId,
      startsAt: {
        lt: params.endsAt,
      },
      endsAt: {
        gt: params.startsAt,
      },
      ...(params.excludeEventIds?.length ? { id: { notIn: params.excludeEventIds } } : {}),
    },
    select: { id: true, title: true },
  });

  if (conflict) {
    throw new AppError(`Ja existe um compromisso conflitante para este usuario: ${conflict.title}.`, ErrorCodes.VALIDATION_ERROR, 422);
  }
}

function buildRecurrenceData(payload: CreateAgendaEventInput) {
  return {
    frequency: payload.recurrenceFrequency,
    interval: payload.recurrenceInterval,
    until: payload.recurrenceUntil,
    count: payload.recurrenceCount,
  };
}

export async function listAgendaEvents(
  scope: AgendaScope,
  filters?: AgendaFilters,
  pagination?: AgendaPagination,
  sort?: AgendaSort,
): Promise<AgendaListResult> {
  const where =
    scope.role === "SUPER_ADMIN"
      ? {}
      : scope.role === "ADMIN"
        ? { tenantId: scope.tenantId }
        : { tenantId: scope.tenantId, ownerId: scope.userId };

  const startsAtFilter =
    filters?.startsFrom || filters?.startsTo
      ? {
          ...(filters?.startsFrom ? { gte: filters.startsFrom } : {}),
          ...(filters?.startsTo ? { lte: filters.startsTo } : {}),
        }
      : undefined;

  const ownerQuery = filters?.ownerQuery?.trim();
  const query = filters?.query?.trim();

  const whereWithFilters = {
    ...where,
    ...(startsAtFilter ? { startsAt: startsAtFilter } : {}),
    ...(ownerQuery
      ? {
          owner: {
            OR: [
              {
                name: {
                  contains: ownerQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: ownerQuery,
                  mode: "insensitive" as const,
                },
              },
            ],
          },
        }
      : {}),
    ...(filters?.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(query
      ? {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const normalizedPagination = normalizePagination(pagination);
  const normalizedSort = normalizeSort(sort);

  const total = await prisma.agendaEvent.count({
    where: whereWithFilters,
  });

  const totalPages = Math.max(1, Math.ceil(total / normalizedPagination.pageSize));
  const currentPage = Math.min(normalizedPagination.page, totalPages);
  const skip = (currentPage - 1) * normalizedPagination.pageSize;

  const events = await prisma.agendaEvent.findMany({
    where: whereWithFilters,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [
      {
        startsAt: normalizedSort.startsAt,
      },
      {
        createdAt: "asc",
      },
    ],
    skip,
    take: normalizedPagination.pageSize,
  });

  return {
    items: events.map((event) => ({
      id: event.id,
      tenantId: event.tenantId,
      tenantName: event.tenant.name,
      tenantSlug: event.tenant.slug,
      ownerId: event.ownerId,
      ownerName: event.owner.name,
      ownerEmail: event.owner.email,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      seriesId: event.seriesId,
      recurrenceFrequency: event.recurrenceFrequency,
      recurrenceInterval: event.recurrenceInterval,
      recurrenceUntil: event.recurrenceUntil,
      recurrenceCount: event.recurrenceCount,
      isRecurringRoot: event.isRecurringRoot,
      recurrenceLabel: formatRecurrenceLabel({
        frequency: event.recurrenceFrequency ?? undefined,
        interval: event.recurrenceInterval ?? undefined,
        until: event.recurrenceUntil ?? undefined,
        count: event.recurrenceCount ?? undefined,
      }),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    })),
    total,
    page: currentPage,
    pageSize: normalizedPagination.pageSize,
    totalPages,
  };
}

export async function createAgendaEvent(input: CreateAgendaEventInput, scope: AgendaScope) {
  const payload = createAgendaEventSchema.parse(input);

  const tenantId = scope.role === "SUPER_ADMIN" ? (payload.tenantId ?? scope.tenantId) : scope.tenantId;
  const ownerId = payload.ownerId ?? scope.userId;

  if (scope.role !== "SUPER_ADMIN" && ownerId !== scope.userId && scope.role !== "ADMIN") {
    throw new AppError("Permissao insuficiente para criar eventos para outro usuario.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  await ensureTenantMembership(ownerId, tenantId);

  const occurrences = buildAgendaOccurrences(
    {
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    },
    buildRecurrenceData(payload),
  );

  for (const occurrence of occurrences) {
    await assertNoAgendaConflict({
      tenantId,
      ownerId,
      startsAt: occurrence.startsAt,
      endsAt: occurrence.endsAt,
    });
  }

  const seriesId = hasRecurrence(buildRecurrenceData(payload)) ? crypto.randomUUID() : null;

  const created = await prisma.$transaction(async (transaction) => {
    const createdEvents: Array<{ id: string; tenantId: string; ownerId: string; title: string; description: string | null; startsAt: Date; endsAt: Date; createdAt: Date }> = [];

    for (const occurrence of occurrences) {
      const createdItem = await transaction.agendaEvent.create({
        data: {
          tenantId,
          ownerId,
          title: payload.title,
          description: payload.description,
          startsAt: occurrence.startsAt,
          endsAt: occurrence.endsAt,
          seriesId,
          recurrenceFrequency: payload.recurrenceFrequency,
          recurrenceInterval: payload.recurrenceFrequency ? (payload.recurrenceInterval ?? 1) : null,
          recurrenceUntil: payload.recurrenceUntil,
          recurrenceCount: payload.recurrenceCount,
          isRecurringRoot: occurrence.index === 0 && Boolean(seriesId),
        },
        select: {
          id: true,
          tenantId: true,
          ownerId: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
        },
      });

      createdEvents.push(createdItem);
    }

    return createdEvents[0];
  });

  return created;
}

export async function updateAgendaEvent(eventId: string, input: UpdateAgendaEventInput, scope: AgendaScope) {
  const payload = updateAgendaEventSchema.parse(input);

  const existing = await prisma.agendaEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      tenantId: true,
      ownerId: true,
      seriesId: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (!existing) {
    throw new AppError("Evento de agenda nao encontrado.", ErrorCodes.AGENDA_EVENT_NOT_FOUND, 404);
  }

  if (!canManageEvent(scope, existing.tenantId, existing.ownerId)) {
    throw new AppError("Permissao insuficiente para atualizar este evento.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  const startsAt = payload.startsAt ?? existing.startsAt;
  const endsAt = payload.endsAt ?? existing.endsAt;

  if (endsAt <= startsAt) {
    throw new AppError("Data de termino deve ser maior que a data de inicio.", ErrorCodes.VALIDATION_ERROR, 422);
  }

  if (payload.ownerId) {
    await ensureTenantMembership(payload.ownerId, existing.tenantId);
  }

  await assertNoAgendaConflict({
    tenantId: existing.tenantId,
    ownerId: payload.ownerId ?? existing.ownerId,
    startsAt,
    endsAt,
    excludeEventIds: [existing.id],
  });

  const updated = await prisma.agendaEvent.update({
    where: {
      id: eventId,
    },
    data: {
      ownerId: payload.ownerId,
      title: payload.title,
      description: payload.description,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    },
    select: {
      id: true,
      tenantId: true,
      ownerId: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      seriesId: true,
      recurrenceFrequency: true,
      recurrenceInterval: true,
      recurrenceUntil: true,
      recurrenceCount: true,
      isRecurringRoot: true,
      updatedAt: true,
    },
  });

  return updated;
}

export async function deleteAgendaEvent(eventId: string, scope: AgendaScope) {
  const existing = await prisma.agendaEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      tenantId: true,
      ownerId: true,
      seriesId: true,
    },
  });

  if (!existing) {
    throw new AppError("Evento de agenda nao encontrado.", ErrorCodes.AGENDA_EVENT_NOT_FOUND, 404);
  }

  if (!canManageEvent(scope, existing.tenantId, existing.ownerId)) {
    throw new AppError("Permissao insuficiente para remover este evento.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  await prisma.agendaEvent.delete({
    where: {
      id: eventId,
    },
  });
}

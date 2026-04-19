import { type AuditSeverity, type Prisma } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { logger } from "@/infra/observability/logger";
import { toCsv } from "@/modules/audit/application/audit-csv";

type RecordAuditEventInput = {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  severity?: AuditSeverity;
  payload?: Prisma.InputJsonValue;
};

type ListAuditEventsInput = {
  tenantId: string;
  page: number;
  pageSize: number;
  action?: string;
  resource?: string;
  severity?: AuditSeverity;
  userId?: string;
  from?: Date;
  to?: Date;
};

type AuditFiltersInput = {
  tenantId: string;
  action?: string;
  resource?: string;
  severity?: AuditSeverity;
  userId?: string;
  from?: Date;
  to?: Date;
};

type ExportAuditEventsCsvInput = AuditFiltersInput & {
  maxRows: number;
};

type RunAuditRetentionInput = {
  retentionDays: number;
  dryRun?: boolean;
  tenantId?: string;
};

type SummarizeAuditEventsInput = {
  tenantId: string;
  from?: Date;
  to?: Date;
};

function buildWhereClause(input: AuditFiltersInput): Prisma.AuditLogWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};

  if (input.from) createdAt.gte = input.from;
  if (input.to) createdAt.lte = input.to;

  return {
    tenantId: input.tenantId,
    action: input.action ? { contains: input.action, mode: "insensitive" } : undefined,
    resource: input.resource ? { contains: input.resource, mode: "insensitive" } : undefined,
    severity: input.severity,
    userId: input.userId,
    createdAt: Object.keys(createdAt).length > 0 ? createdAt : undefined,
  };
}

export async function recordAuditEvent(input: RecordAuditEventInput) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      severity: input.severity,
      payload: input.payload,
    },
  });
}

export async function recordAuditEventSafe(input: RecordAuditEventInput) {
  try {
    await recordAuditEvent(input);
    return true;
  } catch (error) {
    if (!isInfrastructureUnavailableError(error)) {
      throw error;
    }

    logger.warn(
      {
        tenantId: input.tenantId,
        userId: input.userId,
        action: input.action,
        resource: input.resource,
      },
      "Falha ao persistir evento de auditoria por indisponibilidade de infraestrutura.",
    );

    return false;
  }
}

export async function listAuditEvents(input: ListAuditEventsInput) {
  const where = buildWhereClause(input);
  const skip = (input.page - 1) * input.pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: input.pageSize,
      select: {
        id: true,
        action: true,
        resource: true,
        severity: true,
        payload: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    items: items.map((item) => ({
      id: item.id,
      action: item.action,
      resource: item.resource,
      severity: item.severity,
      payload: item.payload,
      createdAt: item.createdAt,
      user: item.user
        ? {
            id: item.user.id,
            name: item.user.name,
            email: item.user.email,
          }
        : null,
    })),
  };
}

export async function summarizeAuditEvents(input: SummarizeAuditEventsInput) {
  const where = buildWhereClause(input);

  const [severityGroups, topActionGroups] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ["severity"],
      where,
      _count: {
        _all: true,
      },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where,
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 10,
    }),
  ]);

  return {
    bySeverity: severityGroups.map((item) => ({
      severity: item.severity,
      count: item._count._all,
    })),
    topActions: topActionGroups.map((item) => ({
      action: item.action,
      count: item._count._all,
    })),
  };
}

export async function exportAuditEventsCsv(input: ExportAuditEventsCsvInput) {
  const where = buildWhereClause(input);

  const items = await prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: input.maxRows,
    select: {
      id: true,
      tenantId: true,
      userId: true,
      action: true,
      resource: true,
      severity: true,
      payload: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const rows = items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    userId: item.userId ?? "",
    userName: item.user?.name ?? "",
    userEmail: item.user?.email ?? "",
    action: item.action,
    resource: item.resource,
    severity: item.severity,
    payload: item.payload ?? "",
    createdAt: item.createdAt.toISOString(),
  }));

  const headers = [
    "id",
    "tenantId",
    "userId",
    "userName",
    "userEmail",
    "action",
    "resource",
    "severity",
    "payload",
    "createdAt",
  ];

  return {
    csv: toCsv(rows, headers),
    rowCount: rows.length,
  };
}

export async function runAuditRetention(input: RunAuditRetentionInput) {
  const retentionDays = Math.max(1, Math.trunc(input.retentionDays));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const where: Prisma.AuditLogWhereInput = {
    createdAt: {
      lt: cutoff,
    },
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
  };

  const eligibleCount = await prisma.auditLog.count({ where });

  if (input.dryRun) {
    return {
      retentionDays,
      cutoff,
      deletedCount: 0,
      eligibleCount,
      dryRun: true,
      tenantId: input.tenantId ?? null,
    };
  }

  const deleted = await prisma.auditLog.deleteMany({ where });

  return {
    retentionDays,
    cutoff,
    deletedCount: deleted.count,
    eligibleCount,
    dryRun: false,
    tenantId: input.tenantId ?? null,
  };
}
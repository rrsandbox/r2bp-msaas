import { type RoleKey, type TicketPriority, type TicketStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";

type SupportScope = {
  role: RoleKey;
  tenantId: string;
  userId: string;
};

const supportTicketSchema = z.object({
  subject: z.string().min(4).max(160),
  description: z.string().min(10).max(4000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

const supportUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  resolution: z.string().max(4000).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
});

export async function listSupportTickets(scope: SupportScope) {
  return prisma.supportTicket.findMany({
    where: {
      ...(scope.role === "SUPER_ADMIN"
        ? {}
        : scope.role === "ADMIN"
          ? { tenantId: scope.tenantId }
          : { tenantId: scope.tenantId, requesterId: scope.userId }),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createSupportTicket(input: unknown, scope: SupportScope) {
  const payload = supportTicketSchema.parse(input);

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId: scope.tenantId,
      requesterId: scope.userId,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority as TicketPriority,
    },
  });

  await prisma.administrativeTask.create({
    data: {
      tenantId: scope.tenantId,
      type: "REVIEW_SUPPORT_TICKET",
      status: "OPEN",
      title: `Ticket de suporte: ${ticket.subject}`,
      description: "Novo ticket de suporte aberto no dashboard.",
      payload: {
        ticketId: ticket.id,
      },
    },
  });

  return ticket;
}

export async function updateSupportTicket(ticketId: string, input: unknown, scope: SupportScope) {
  if (scope.role === "USER") {
    throw new AppError("Permissao insuficiente para atualizar tickets.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }

  const payload = supportUpdateSchema.parse(input);
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      ...(scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId }),
    },
    select: { id: true },
  });

  if (!ticket) {
    throw new AppError("Ticket de suporte nao encontrado.", ErrorCodes.SUPPORT_TICKET_NOT_FOUND, 404);
  }

  const status = payload.status as TicketStatus | undefined;

  return prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status,
      priority: payload.priority as TicketPriority | undefined,
      resolution: payload.resolution,
      assigneeId: payload.assigneeId ?? undefined,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
    },
  });
}
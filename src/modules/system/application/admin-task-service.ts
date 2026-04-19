import { type RoleKey, type TaskStatus } from "@prisma/client";

import { prisma } from "@/infra/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";

type TaskScope = {
  role: RoleKey;
  tenantId: string;
  userId: string;
};

function assertTaskAccess(scope: TaskScope) {
  if (!["SUPER_ADMIN", "ADMIN"].includes(scope.role)) {
    throw new AppError("Permissao insuficiente para acessar a lista de atividades.", ErrorCodes.RBAC_FORBIDDEN, 403);
  }
}

export async function listAdministrativeTasks(scope: TaskScope, status?: TaskStatus) {
  assertTaskAccess(scope);

  return prisma.administrativeTask.findMany({
    where: {
      ...(scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId }),
      ...(status ? { status } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateAdministrativeTaskStatus(taskId: string, nextStatus: TaskStatus, scope: TaskScope) {
  assertTaskAccess(scope);

  const task = await prisma.administrativeTask.findFirst({
    where: {
      id: taskId,
      ...(scope.role === "SUPER_ADMIN" ? {} : { tenantId: scope.tenantId }),
    },
    select: {
      id: true,
    },
  });

  if (!task) {
    throw new AppError("Atividade nao encontrada.", ErrorCodes.TASK_NOT_FOUND, 404);
  }

  return prisma.administrativeTask.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      resolvedAt: nextStatus === "COMPLETED" ? new Date() : null,
      assignedToId: scope.userId,
    },
  });
}
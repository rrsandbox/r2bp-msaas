import { logger } from "@/infra/observability/logger";
import { AppError } from "@/lib/errors/app-error";
import { normalizeError } from "@/lib/errors/normalize-error";

type ReportErrorParams = {
  error: unknown;
  operation: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
};

export function reportError(params: ReportErrorParams) {
  const normalized = normalizeError(params.error);

  logger.error(
    {
      requestId: params.requestId,
      tenantId: params.tenantId,
      userId: params.userId,
      operation: params.operation,
      errorCode: normalized.code,
      statusCode: normalized.statusCode,
      details: normalized.details,
      cause: normalized.cause,
      stack: params.error instanceof Error ? params.error.stack : undefined,
    },
    normalized.message,
  );

  return normalized;
}

export function getPublicErrorMessage(error: AppError) {
  if (error.statusCode >= 500) {
    return "Nao foi possivel concluir a operacao no momento. Tente novamente em instantes.";
  }

  return error.message;
}
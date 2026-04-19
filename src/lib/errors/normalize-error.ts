import { ZodError } from "zod";

import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";
import {
  getInfrastructureErrorCode,
  getInfrastructureUserMessage,
  isInfrastructureUnavailableError,
} from "@/lib/errors/infrastructure";

type NormalizeErrorOptions = {
  fallbackMessage?: string;
  fallbackStatusCode?: number;
};

export function normalizeError(error: unknown, options?: NormalizeErrorOptions) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(
      "Dados invalidos para processar a solicitacao.",
      ErrorCodes.VALIDATION_ERROR,
      422,
      {
        issues: error.issues,
      },
      error,
    );
  }

  if (isInfrastructureUnavailableError(error)) {
    return new AppError(
      getInfrastructureUserMessage(),
      getInfrastructureErrorCode(),
      503,
      undefined,
      error,
    );
  }

  return new AppError(
    options?.fallbackMessage ?? "Erro interno nao esperado.",
    ErrorCodes.INTERNAL_ERROR,
    options?.fallbackStatusCode ?? 500,
    undefined,
    error,
  );
}
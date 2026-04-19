import { Prisma } from "@prisma/client";

import { ErrorCodes } from "@/lib/errors/error-codes";

const DATABASE_ERROR_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1010",
  "P1011",
  "P1013",
  "P1017",
  "P2021",
  "P2022",
]);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.toLowerCase() : "";
}

export function isInfrastructureUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return DATABASE_ERROR_CODES.has(error.code);
  }

  const message = errorMessage(error);

  return (
    message.includes("database_url") ||
    message.includes("can't reach database server") ||
    message.includes("failed to connect") ||
    message.includes("connection")
  );
}

export function getInfrastructureUserMessage() {
  return "Ambiente de banco ainda nao configurado. Configure DATABASE_URL, aplique migrations e rode o seed.";
}

export function getInfrastructureErrorCode() {
  return ErrorCodes.INFRA_UNAVAILABLE;
}
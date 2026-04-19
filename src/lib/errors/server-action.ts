import { redirect } from "next/navigation";

import { ErrorCodes } from "@/lib/errors/error-codes";
import { getPublicErrorMessage, reportError } from "@/lib/errors/report-error";

type HandleServerActionErrorParams = {
  error: unknown;
  operation: string;
  redirectTo: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  beforeRedirect?: (errorCode: string) => Promise<void>;
};

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function handleServerActionError(params: HandleServerActionErrorParams): Promise<never> {
  if (isNextRedirectError(params.error)) throw params.error;

  const normalized = reportError({
    error: params.error,
    operation: params.operation,
    requestId: params.requestId,
    tenantId: params.tenantId,
    userId: params.userId,
  });

  if (params.beforeRedirect) {
    await params.beforeRedirect(normalized.code);
  }

  const baseMessage =
    normalized.code === ErrorCodes.INTERNAL_ERROR ? getPublicErrorMessage(normalized) : normalized.message;

  const messageWithTrace = params.requestId ? `${baseMessage} [trace=${params.requestId}]` : baseMessage;
  const target = new URL(params.redirectTo, "http://localhost");
  target.searchParams.set("error", messageWithTrace);
  const destination = `${target.pathname}${target.search}` as Parameters<typeof redirect>[0];

  redirect(destination);
}
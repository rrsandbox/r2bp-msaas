import { NextResponse } from "next/server";

import { reportError } from "@/lib/errors/report-error";

type SuccessEnvelope<T> = {
  ok: true;
  traceId?: string;
  timestamp: string;
  data: T;
};

type ErrorEnvelope = {
  ok: false;
  traceId?: string;
  timestamp: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type ApiContext = {
  operation: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
};

export function successResponse<T>(data: T, status = 200, traceId?: string) {
  const payload: SuccessEnvelope<T> = {
    ok: true,
    traceId,
    timestamp: new Date().toISOString(),
    data,
  };

  return NextResponse.json(payload, { status });
}

export function errorResponse(error: unknown, context: ApiContext) {
  const normalized = reportError({
    error,
    operation: context.operation,
    requestId: context.requestId,
    tenantId: context.tenantId,
    userId: context.userId,
  });

  const payload: ErrorEnvelope = {
    ok: false,
    traceId: context.requestId,
    timestamp: new Date().toISOString(),
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    },
  };

  return NextResponse.json(payload, { status: normalized.statusCode });
}

export async function withApiErrorHandling<T>(
  context: ApiContext,
  handler: () => Promise<NextResponse<SuccessEnvelope<T>>>,
) {
  try {
    return await handler();
  } catch (error) {
    return errorResponse(error, context);
  }
}
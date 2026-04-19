import { headers } from "next/headers";

import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";

export async function GET() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.system.status.get",
      requestId,
    },
    async () => {
      return successResponse(
        {
          service: "r2bp-msaas",
          status: "ok",
        },
        200,
        requestId,
      );
    },
  );
}
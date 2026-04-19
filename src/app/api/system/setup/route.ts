import { headers } from "next/headers";

import { prisma } from "@/infra/db/prisma";
import { successResponse, withApiErrorHandling } from "@/lib/http/api-response";

type SetupTableCheck = {
  table: string;
  exists: boolean;
};

const CRITICAL_TABLES = [
  "Tenant",
  "User",
  "TenantMembership",
  "AgendaEvent",
  "AccessFeature",
  "UserFeaturePermission",
] as const;

export async function GET() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? undefined;

  return withApiErrorHandling(
    {
      operation: "api.system.setup.get",
      requestId,
    },
    async () => {
      let databaseConnected = false;
      let migrationTablePresent = false;
      let checks: SetupTableCheck[] = [];

      try {
        await prisma.$queryRawUnsafe("SELECT 1");
        databaseConnected = true;

        const migrationRows = await prisma.$queryRawUnsafe<Array<{ table_name: string | null }>>(
          'SELECT to_regclass(\'public."_prisma_migrations"\')::text as table_name',
        );
        migrationTablePresent = Boolean(migrationRows[0]?.table_name);

        const tableChecks = await Promise.all(
          CRITICAL_TABLES.map(async (tableName) => {
            const rows = await prisma.$queryRawUnsafe<Array<{ table_name: string | null }>>(
              `SELECT to_regclass('public."${tableName}"')::text as table_name`,
            );

            return {
              table: tableName,
              exists: Boolean(rows[0]?.table_name),
            } satisfies SetupTableCheck;
          }),
        );

        checks = tableChecks;
      } catch {
        databaseConnected = false;
      }

      const missingTables = checks.filter((check) => !check.exists).map((check) => check.table);
      const status = databaseConnected && missingTables.length === 0 ? "ok" : "degraded";

      return successResponse(
        {
          service: "r2bp-msaas",
          status,
          databaseConnected,
          migrationTablePresent,
          tables: checks,
          missingTables,
          recommendations: [
            ...(databaseConnected ? [] : ["Inicie o banco local (ex.: supabase start)."]),
            ...(databaseConnected && !migrationTablePresent
              ? ["Execute as migracoes (ex.: npm run db:migrate ou npm run db:deploy)."]
              : []),
            ...(databaseConnected && missingTables.length > 0
              ? ["Aplique as migracoes pendentes e rode npm run db:seed novamente."]
              : []),
          ],
        },
        200,
        requestId,
      );
    },
  );
}

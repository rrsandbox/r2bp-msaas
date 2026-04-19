import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TableCheck = {
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

async function main() {
  const checks: TableCheck[] = [];

  await prisma.$queryRawUnsafe("SELECT 1");

  const migrationRows = await prisma.$queryRawUnsafe<Array<{ table_name: string | null }>>(
    'SELECT to_regclass(\'public."_prisma_migrations"\')::text as table_name',
  );
  const migrationTablePresent = Boolean(migrationRows[0]?.table_name);

  for (const tableName of CRITICAL_TABLES) {
    const rows = await prisma.$queryRawUnsafe<Array<{ table_name: string | null }>>(
      `SELECT to_regclass('public."${tableName}"')::text as table_name`,
    );

    checks.push({
      table: tableName,
      exists: Boolean(rows[0]?.table_name),
    });
  }

  const missingTables = checks.filter((check) => !check.exists).map((check) => check.table);
  const status = migrationTablePresent && missingTables.length === 0 ? "ok" : "degraded";

  console.log(`[db:check-local] status=${status}`);
  console.log(`[db:check-local] migrationTablePresent=${migrationTablePresent}`);
  console.table(checks);

  if (!migrationTablePresent) {
    console.error("[db:check-local] Tabela _prisma_migrations nao encontrada.");
  }

  if (missingTables.length > 0) {
    console.error(`[db:check-local] Tabelas faltando: ${missingTables.join(", ")}`);
  }

  if (status !== "ok") {
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[db:check-local] erro:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

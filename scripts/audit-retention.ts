import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Args = {
  days: number;
  dryRun: boolean;
  tenantId?: string;
};

function parseArgs(argv: string[]): Args {
  const envDays = Number(process.env.npm_config_days ?? process.env.AUDIT_RETENTION_DAYS ?? "180");
  const envDryRun =
    String(process.env.npm_config_dry_run ?? process.env.AUDIT_RETENTION_DRY_RUN ?? "false").toLowerCase() ===
    "true";
  const envTenant = (process.env.npm_config_tenant ?? process.env.AUDIT_RETENTION_TENANT_ID ?? "").trim() || undefined;

  let days = Number.isFinite(envDays) && envDays > 0 ? Math.trunc(envDays) : 180;
  let dryRun = envDryRun;
  let tenantId: string | undefined = envTenant;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith("--days=")) {
      const raw = Number(arg.slice("--days=".length));
      if (Number.isFinite(raw) && raw > 0) {
        days = Math.trunc(raw);
      }
      continue;
    }

    if (arg === "--days") {
      const next = Number(argv[index + 1] ?? "");
      if (Number.isFinite(next) && next > 0) {
        days = Math.trunc(next);
        index += 1;
      }
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg.startsWith("--tenant=")) {
      const value = arg.slice("--tenant=".length).trim();
      tenantId = value || undefined;
    }
  }

  return {
    days,
    dryRun,
    tenantId,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - args.days);

  const where = {
    createdAt: {
      lt: cutoff,
    },
    ...(args.tenantId ? { tenantId: args.tenantId } : {}),
  };

  const eligibleCount = await prisma.auditLog.count({ where });

  if (args.dryRun) {
    console.log("[audit-retention] dry-run");
    console.log(JSON.stringify({
      retentionDays: args.days,
      tenantId: args.tenantId ?? null,
      cutoff: cutoff.toISOString(),
      eligibleCount,
      deletedCount: 0,
      dryRun: true,
    }, null, 2));
    return;
  }

  const deleted = await prisma.auditLog.deleteMany({ where });

  console.log("[audit-retention] done");
  console.log(JSON.stringify({
    retentionDays: args.days,
    tenantId: args.tenantId ?? null,
    cutoff: cutoff.toISOString(),
    eligibleCount,
    deletedCount: deleted.count,
    dryRun: false,
  }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[audit-retention] erro:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

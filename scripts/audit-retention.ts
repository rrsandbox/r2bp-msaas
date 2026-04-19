import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Args = {
  days: number;
  dryRun: boolean;
  confirmDelete: boolean;
  reason?: string;
  tenantId?: string;
};

const DEFAULT_RETENTION_DAYS = 180;
const MIN_REASON_LENGTH = 10;

function normalizeArgs(input: Args): Args {
  const days = Number.isFinite(input.days) && input.days > 0 ? Math.trunc(input.days) : DEFAULT_RETENTION_DAYS;
  const reason = input.reason?.trim() || undefined;

  if (!input.dryRun) {
    if (!input.confirmDelete) {
      throw new Error("Execucao destrutiva exige --confirm-delete.");
    }

    if (!reason || reason.length < MIN_REASON_LENGTH) {
      throw new Error(`Informe --reason com ao menos ${MIN_REASON_LENGTH} caracteres para execucao destrutiva.`);
    }
  }

  return {
    days,
    dryRun: input.dryRun,
    confirmDelete: input.confirmDelete,
    reason,
    tenantId: input.tenantId,
  };
}

function parseArgs(argv: string[]): Args {
  const envDays = Number(process.env.npm_config_days ?? process.env.AUDIT_RETENTION_DAYS ?? String(DEFAULT_RETENTION_DAYS));
  const envDryRun =
    String(process.env.npm_config_dry_run ?? process.env.AUDIT_RETENTION_DRY_RUN ?? "true").toLowerCase() ===
    "true";
  const envExecute =
    String(process.env.npm_config_execute ?? process.env.AUDIT_RETENTION_EXECUTE ?? "false").toLowerCase() ===
    "true";
  const envConfirmDelete =
    String(process.env.npm_config_confirm_delete ?? process.env.AUDIT_RETENTION_CONFIRM_DELETE ?? "false").toLowerCase() ===
    "true";
  const envReason = (process.env.npm_config_reason ?? process.env.AUDIT_RETENTION_REASON ?? "").trim() || undefined;
  const envTenant = (process.env.npm_config_tenant ?? process.env.AUDIT_RETENTION_TENANT_ID ?? "").trim() || undefined;

  let days = Number.isFinite(envDays) && envDays > 0 ? Math.trunc(envDays) : DEFAULT_RETENTION_DAYS;
  let dryRun = envExecute ? false : envDryRun;
  let confirmDelete = envConfirmDelete;
  let reason = envReason;
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

    if (arg === "--execute") {
      dryRun = false;
      continue;
    }

    if (arg === "--confirm-delete") {
      confirmDelete = true;
      continue;
    }

    if (arg.startsWith("--reason=")) {
      const value = arg.slice("--reason=".length).trim();
      reason = value || undefined;
      continue;
    }

    if (arg === "--reason") {
      const value = (argv[index + 1] ?? "").trim();
      if (value) {
        reason = value;
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--tenant=")) {
      const value = arg.slice("--tenant=".length).trim();
      tenantId = value || undefined;
    }
  }

  return normalizeArgs({
    days,
    dryRun,
    confirmDelete,
    reason,
    tenantId,
  });
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
    reason: args.reason ?? null,
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

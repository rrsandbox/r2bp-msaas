import { AppError } from "@/lib/errors/app-error";
import {
  DEFAULT_AUDIT_RETENTION_DAYS,
  MAX_AUDIT_RETENTION_DAYS,
  resolveRetentionExecution,
} from "@/modules/audit/application/audit-retention-policy";

describe("audit retention policy", () => {
  it("defaults to dry-run and default retention", () => {
    const resolved = resolveRetentionExecution({});

    expect(resolved.dryRun).toBe(true);
    expect(resolved.retentionDays).toBe(DEFAULT_AUDIT_RETENTION_DAYS);
  });

  it("rejects destructive execution without explicit confirmation", () => {
    expect(() =>
      resolveRetentionExecution({
        dryRun: false,
        reason: "retencao mensal de auditoria",
      }),
    ).toThrow(AppError);
  });

  it("rejects destructive execution without minimum reason", () => {
    expect(() =>
      resolveRetentionExecution({
        dryRun: false,
        confirmDelete: true,
        reason: "curto",
      }),
    ).toThrow(AppError);
  });

  it("accepts destructive execution with confirmation and reason", () => {
    const resolved = resolveRetentionExecution({
      dryRun: false,
      confirmDelete: true,
      reason: "retencao semestral aprovada pelo compliance",
      retentionDays: 30,
    });

    expect(resolved.dryRun).toBe(false);
    expect(resolved.confirmDelete).toBe(true);
    expect(resolved.retentionDays).toBe(30);
  });

  it("clamps retention days to max allowed", () => {
    const resolved = resolveRetentionExecution({ retentionDays: 999999 });
    expect(resolved.retentionDays).toBe(MAX_AUDIT_RETENTION_DAYS);
  });
});

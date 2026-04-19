import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/error-codes";

export const DEFAULT_AUDIT_RETENTION_DAYS = 180;
export const MAX_AUDIT_RETENTION_DAYS = 3650;
export const MIN_AUDIT_RETENTION_REASON_LENGTH = 10;

type ResolveRetentionExecutionInput = {
  retentionDays?: number;
  dryRun?: boolean;
  confirmDelete?: boolean;
  reason?: string;
  tenantId?: string;
};

export function resolveRetentionExecution(input: ResolveRetentionExecutionInput) {
  const retentionDaysValue = Number(input.retentionDays ?? DEFAULT_AUDIT_RETENTION_DAYS);
  const retentionDays =
    Number.isFinite(retentionDaysValue) && retentionDaysValue > 0
      ? Math.min(Math.trunc(retentionDaysValue), MAX_AUDIT_RETENTION_DAYS)
      : DEFAULT_AUDIT_RETENTION_DAYS;

  const dryRun = input.dryRun ?? true;
  const confirmDelete = Boolean(input.confirmDelete);
  const reason = input.reason?.trim();
  const tenantId = input.tenantId?.trim() || undefined;

  if (!dryRun) {
    if (!confirmDelete) {
      throw new AppError(
        "Execucao destrutiva exige confirmacao explicita (confirmDelete=true).",
        ErrorCodes.VALIDATION_ERROR,
        422,
      );
    }

    if (!reason || reason.length < MIN_AUDIT_RETENTION_REASON_LENGTH) {
      throw new AppError(
        `Informe um motivo com ao menos ${MIN_AUDIT_RETENTION_REASON_LENGTH} caracteres para executar retencao destrutiva.`,
        ErrorCodes.VALIDATION_ERROR,
        422,
      );
    }
  }

  return {
    retentionDays,
    dryRun,
    confirmDelete,
    reason,
    tenantId,
  };
}

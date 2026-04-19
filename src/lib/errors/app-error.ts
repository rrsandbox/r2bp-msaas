import { type ErrorCode } from "@/lib/errors/error-codes";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode | string,
    public readonly statusCode = 400,
    public readonly details?: Record<string, unknown>,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
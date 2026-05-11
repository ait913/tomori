import type { AppErrorCode } from "./types.js";

export class AppError extends Error {
  public readonly status: number;
  public readonly code: AppErrorCode;
  public readonly details?: unknown;

  public constructor(status: number, code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

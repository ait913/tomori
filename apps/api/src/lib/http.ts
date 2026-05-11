import type { Context } from "hono";
import { z } from "zod";

import { AppError, type ApiFailure, type ApiSuccess } from "@tomori/shared";

export async function parseJson<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new AppError(400, "VALIDATION_FAILED", "Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_FAILED", "Validation failed", result.error.flatten());
  }
  return result.data;
}

export function parseQuery<T>(input: Record<string, string | undefined>, schema: z.ZodType<T>): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_FAILED", "Validation failed", result.error.flatten());
  }
  return result.data;
}

export function ok<T>(data: T, status = 200): { body: ApiSuccess<T>; status: number } {
  return { body: { ok: true, data }, status };
}

export function fail(error: ApiFailure["error"], status: number): { body: ApiFailure; status: number } {
  return {
    body: { ok: false, error },
    status
  };
}

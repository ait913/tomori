import type { MiddlewareHandler } from "hono";

import { AppError } from "@tomori/shared";

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const store = new Map<string, Bucket>();

function consume(key: string, ratePerSecond: number, burst: number): boolean {
  const now = Date.now();
  const existing = store.get(key) ?? { tokens: burst, lastRefill: now };
  const elapsed = (now - existing.lastRefill) / 1_000;
  const refilled = Math.min(burst, existing.tokens + elapsed * ratePerSecond);
  const next: Bucket = {
    tokens: refilled,
    lastRefill: now
  };

  if (next.tokens < 1) {
    store.set(key, next);
    return false;
  }

  next.tokens -= 1;
  store.set(key, next);
  return true;
}

export function rateLimit(name: string, ratePerSecond: number, burst: number): MiddlewareHandler {
  return async (c, next) => {
    const sessionUser = c.get("sessionUser");
    const key = `${name}:${sessionUser?.id ?? c.req.header("x-forwarded-for") ?? "anon"}`;
    if (!consume(key, ratePerSecond, burst)) {
      throw new AppError(429, "RATE_LIMITED", "Rate limited");
    }
    await next();
  };
}

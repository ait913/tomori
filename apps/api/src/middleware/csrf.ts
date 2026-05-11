import type { MiddlewareHandler } from "hono";

import { appConfig } from "../lib/config.js";
import { CSRF_HEADER } from "../lib/auth.js";
import { AppError } from "@tomori/shared";

const STATE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const csrfMiddleware = (): MiddlewareHandler => async (c, next) => {
  if (!STATE_METHODS.has(c.req.method)) {
    await next();
    return;
  }

  const origin = c.req.header("origin");
  if (!origin || origin !== appConfig.TOMORI_CORS_ORIGIN) {
    throw new AppError(403, "FORBIDDEN", "Origin is not allowed");
  }

  const token = c.req.header(CSRF_HEADER);
  if (!token) {
    throw new AppError(403, "FORBIDDEN", "Missing CSRF header");
  }

  await next();
};

import { Hono } from "hono";
import { cors } from "hono/cors";

import { AppError } from "@tomori/shared";
import { createKEKProvider } from "@tomori/crypto";
import { loadCrisisCardFromEnv } from "@tomori/safety";

import { appConfig } from "./lib/config.js";
import { pool } from "./lib/db.js";
import { fail } from "./lib/http.js";
import { log } from "./lib/logger.js";
import { accountRoutes } from "./routes/account.js";
import { authRoutes } from "./routes/auth.js";
import { dialogRoutes } from "./routes/dialog.js";
import { exportRoutes } from "./routes/export.js";
import { healthHandler } from "./routes/health.js";
import { historyRoutes } from "./routes/history.js";
import { moodRoutes } from "./routes/mood.js";
import { sleepRoutes } from "./routes/sleep.js";
import { csrfMiddleware } from "./middleware/csrf.js";
import { requestId } from "./middleware/request-id.js";
import { secureHeaders } from "./middleware/secure-headers.js";
import { sessionMiddleware } from "./middleware/session.js";
import type { ApiEnv } from "./types.js";

const kekProvider = createKEKProvider();
const crisisCard = loadCrisisCardFromEnv();

export function createApp(): Hono<ApiEnv> {
  const app = new Hono<ApiEnv>();

  app.use("*", requestId());
  app.use("*", secureHeaders());
  app.use(
    "/api/*",
    cors({
      origin: appConfig.TOMORI_CORS_ORIGIN,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "X-Tomori-Csrf"],
      credentials: true
    })
  );
  app.use("*", async (c, next) => {
    c.set("pool", pool);
    c.set("kekProvider", kekProvider);
    c.set("crisisCard", crisisCard);
    await next();
  });
  app.use("/api/*", sessionMiddleware());
  app.use("/api/*", csrfMiddleware());

  app.route("/api/auth", authRoutes);
  app.route("/api/mood", moodRoutes);
  app.route("/api/sleep", sleepRoutes);
  app.route("/api/dialog", dialogRoutes);
  app.route("/api/history", historyRoutes);
  app.route("/api/account", accountRoutes);
  app.route("/api/export", exportRoutes);
  app.get("/api/healthz", healthHandler);

  app.onError((err, c) => {
    const appError =
      err instanceof AppError
        ? err
        : new AppError(500, "INTERNAL", "Unexpected internal error");

    log(appError.status >= 500 ? "error" : "info", {
      request_id: c.get("requestId"),
      user_id: c.get("sessionUser")?.id,
      path: c.req.path,
      status: appError.status,
      error_code: appError.code
    });

    if (appError.code === "CRISIS_HANDOFF" && appError.details) {
      return c.json(
        fail(
          {
            code: appError.code,
            message: appError.message,
            details: appError.details
          },
          appError.status
        ).body,
        appError.status
      );
    }

    return c.json(
      fail(
        {
          code: appError.code,
          message: appError.message,
          details: appError.details
        },
        appError.status
      ).body,
      appError.status
    );
  });

  return app;
}

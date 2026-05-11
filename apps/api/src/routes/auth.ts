import { Hono } from "hono";
import { Resend } from "resend";

import { AppError, MagicLinkRequestSchema } from "@tomori/shared";

import { appConfig } from "../lib/config.js";
import { clearSessionCookie, createMagicExpiry, createOpaqueToken, createSessionExpiry, hashToken, requireSessionUser, setSessionCookie } from "../lib/auth.js";
import { log } from "../lib/logger.js";
import { parseJson, ok } from "../lib/http.js";
import type { ApiEnv } from "../types.js";

export const authRoutes = new Hono<ApiEnv>();

const resend = new Resend(appConfig.RESEND_API_KEY);

authRoutes.post("/magic/request", async (c) => {
  const body = await parseJson(c, MagicLinkRequestSchema);
  const email = body.email.trim().toLowerCase();
  const allowed = appConfig.allowlist.includes(email);

  if (allowed) {
    const token = createOpaqueToken();
    await c.get("pool").query(
      `INSERT INTO magic_tokens (email, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [email, hashToken(token), createMagicExpiry()]
    );

    const link = `${appConfig.TOMORI_PUBLIC_BASE_URL}/api/auth/magic/verify?token=${encodeURIComponent(token)}`;
    try {
      await resend.emails.send({
        from: "tomori <onboarding@resend.dev>",
        to: email,
        subject: "tomori ログインリンク",
        text: `30 分以内にログインしてください: ${link}`
      });
    } catch (error) {
      log("error", {
        request_id: c.get("requestId"),
        path: "/api/auth/magic/request",
        status: 200,
        error_code: "resend_failed"
      });
      void error;
    }
  }

  return c.json(ok({ sent: true }).body);
});

authRoutes.get("/magic/verify", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    throw new AppError(400, "VALIDATION_FAILED", "Missing token");
  }

  const pool = c.get("pool");
  const tokenHash = hashToken(token);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const lookup = await client.query<{
      id: string;
      email: string;
      expires_at: Date;
      consumed_at: Date | null;
    }>(
      `SELECT id, email, expires_at, consumed_at
       FROM magic_tokens
       WHERE token_hash = $1
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    const row = lookup.rows[0];
    if (!row || row.consumed_at || row.expires_at <= new Date()) {
      throw new AppError(400, "VALIDATION_FAILED", "Token is invalid or expired");
    }

    await client.query(`UPDATE magic_tokens SET consumed_at = now() WHERE id = $1`, [row.id]);

    const existingUser = await client.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE email = $1 LIMIT 1`,
      [row.email]
    );

    const user =
      existingUser.rows[0] ??
      (
        await client.query<{ id: string; email: string }>(
          `INSERT INTO users (email)
           VALUES ($1)
           RETURNING id, email`,
          [row.email]
        )
      ).rows[0]!;

    const sessionToken = createOpaqueToken();
    const sessionInsert = await client.query<{ id: string }>(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.id, hashToken(sessionToken), createSessionExpiry()]
    );

    await client.query("COMMIT");
    setSessionCookie(c, sessionToken);
    c.header("Location", "/");
    return c.body(null, 302);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

authRoutes.post("/logout", async (c) => {
  const sessionUser = await requireSessionUser(c);
  await c.get("pool").query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [sessionUser.sessionId]);
  clearSessionCookie(c);
  return c.json(ok({ loggedOut: true }).body);
});

authRoutes.get("/me", async (c) => {
  const sessionUser = await requireSessionUser(c);
  return c.json(ok({ id: sessionUser.id, email: sessionUser.email }).body);
});

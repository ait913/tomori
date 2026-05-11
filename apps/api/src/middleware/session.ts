import type { MiddlewareHandler } from "hono";

import { readSessionCookie, hashToken } from "../lib/auth.js";

export const sessionMiddleware = (): MiddlewareHandler => async (c, next) => {
  const pool = c.get("pool");
  const token = readSessionCookie(c);

  if (!token) {
    c.set("sessionUser", null);
    await next();
    return;
  }

  const tokenHash = hashToken(token);
  const result = await pool.query<{
    session_id: string;
    user_id: string;
    email: string;
  }>(
    `SELECT sessions.id AS session_id, users.id AS user_id, users.email
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.revoked_at IS NULL
       AND sessions.expires_at > now()
       AND users.deleted_at IS NULL
     LIMIT 1`,
    [tokenHash]
  );

  const row = result.rows[0];
  c.set(
    "sessionUser",
    row
      ? {
          id: row.user_id,
          email: row.email,
          sessionId: row.session_id
        }
      : null
  );

  await next();
};

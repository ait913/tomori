import { Hono } from "hono";

import { AccountDeleteInputSchema } from "@tomori/shared";

import { clearSessionCookie, requireSessionUser } from "../lib/auth.js";
import { parseJson, ok } from "../lib/http.js";
import type { ApiEnv } from "../types.js";

export const accountRoutes = new Hono<ApiEnv>();

accountRoutes.post("/delete", async (c) => {
  const sessionUser = await requireSessionUser(c);
  await parseJson(c, AccountDeleteInputSchema);
  const client = await c.get("pool").connect();
  try {
    await client.query("BEGIN");
    const user = await client.query<{ id: string }>(`SELECT id FROM users WHERE id = $1 FOR UPDATE`, [sessionUser.id]);
    const userId = user.rows[0]!.id;

    await client.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM sleep_logs WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM crisis_events WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM dialog_sessions WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM mood_logs WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM user_keys WHERE user_id = $1`, [userId]);
    await client.query(
      `UPDATE users
       SET deleted_at = now(),
           email = $2
       WHERE id = $1`,
      [userId, `deleted-${userId}@tomori.local`]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  clearSessionCookie(c);
  return c.json(ok({ deleted: true }).body);
});

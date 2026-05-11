import { Hono } from "hono";

import { SleepDateQuerySchema, SleepReportInputSchema } from "@tomori/shared";

import { requireSessionUser } from "../lib/auth.js";
import { parseJson, parseQuery, ok } from "../lib/http.js";
import type { ApiEnv } from "../types.js";

export const sleepRoutes = new Hono<ApiEnv>();

sleepRoutes.post("/", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const body = await parseJson(c, SleepReportInputSchema);
  await c.get("pool").query(
    `INSERT INTO sleep_logs (user_id, date, bedtime_at, wake_at, quality)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, date) DO UPDATE
     SET bedtime_at = COALESCE(EXCLUDED.bedtime_at, sleep_logs.bedtime_at),
         wake_at = COALESCE(EXCLUDED.wake_at, sleep_logs.wake_at),
         quality = COALESCE(EXCLUDED.quality, sleep_logs.quality)`,
    [sessionUser.id, body.date, body.bedtime_at ?? null, body.wake_at ?? null, body.quality ?? null]
  );

  return c.json(ok({ saved: true }).body, 201);
});

sleepRoutes.get("/", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const query = parseQuery({ date: c.req.query("date") }, SleepDateQuerySchema);
  const result = await c.get("pool").query<{
    id: string;
    date: string;
    bedtime_at: Date | null;
    wake_at: Date | null;
    quality: number | null;
    source: string;
  }>(
    `SELECT id, date::text, bedtime_at, wake_at, quality, source
     FROM sleep_logs
     WHERE user_id = $1 AND date = $2`,
    [sessionUser.id, query.date]
  );

  const row = result.rows[0];
  return c.json(
    ok(
      row
        ? {
            id: row.id,
            date: row.date,
            bedtime_at: row.bedtime_at?.toISOString() ?? null,
            wake_at: row.wake_at?.toISOString() ?? null,
            quality: row.quality,
            source: row.source
          }
        : null
    ).body
  );
});

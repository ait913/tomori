import { Hono } from "hono";

import { HistoryQuerySchema, type DialogSummary } from "@tomori/shared";

import { requireSessionUser } from "../lib/auth.js";
import { decryptForUser } from "../lib/crypto.js";
import { parseQuery, ok } from "../lib/http.js";
import type { ApiEnv } from "../types.js";

export const historyRoutes = new Hono<ApiEnv>();

historyRoutes.get("/", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const { date } = parseQuery({ date: c.req.query("date") }, HistoryQuerySchema);
  const pool = c.get("pool");

  const [moods, sleep, summaries] = await Promise.all([
    pool.query<{
      id: string;
      ts: Date;
      score: 1 | 2 | 3 | 4 | 5;
      valence: number | null;
      arousal: number | null;
      tags: string[];
      note_cipher: Buffer | null;
      note_nonce: Buffer | null;
      dek_id: string | null;
      alg_version: number;
      source: string;
    }>(
      `SELECT id, ts, score, valence, arousal, tags, note_cipher, note_nonce, dek_id, alg_version, source
       FROM mood_logs
       WHERE user_id = $1 AND (ts AT TIME ZONE 'Asia/Tokyo')::date = $2::date
       ORDER BY ts DESC`,
      [sessionUser.id, date]
    ),
    pool.query<{
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
      [sessionUser.id, date]
    ),
    pool.query<{
      summary_cipher: Buffer;
      summary_nonce: Buffer;
      dek_id: string;
      alg_version: number;
    }>(
      `SELECT summary_cipher, summary_nonce, dek_id, alg_version
       FROM dialog_summaries
       WHERE user_id = $1 AND date = $2
       ORDER BY ts DESC`,
      [sessionUser.id, date]
    )
  ]);

  const moodData = await Promise.all(
    moods.rows.map(async (row) => ({
      id: row.id,
      ts: row.ts.toISOString(),
      score: row.score,
      valence: row.valence,
      arousal: row.arousal,
      tags: row.tags,
      note:
        row.note_cipher && row.note_nonce && row.dek_id
          ? await decryptForUser(pool, c.get("kekProvider"), sessionUser.id, row.dek_id, row.note_cipher, row.note_nonce, row.alg_version)
          : null,
      source: row.source
    }))
  );

  const summaryData = await Promise.all(
    summaries.rows.map(async (row) =>
      JSON.parse(
        await decryptForUser(pool, c.get("kekProvider"), sessionUser.id, row.dek_id, row.summary_cipher, row.summary_nonce, row.alg_version)
      ) as DialogSummary
    )
  );

  return c.json(
    ok({
      mood: moodData,
      sleep: sleep.rows[0]
        ? {
            id: sleep.rows[0].id,
            date: sleep.rows[0].date,
            bedtime_at: sleep.rows[0].bedtime_at?.toISOString() ?? null,
            wake_at: sleep.rows[0].wake_at?.toISOString() ?? null,
            quality: sleep.rows[0].quality,
            source: sleep.rows[0].source
          }
        : null,
      summaries: summaryData
    }).body
  );
});

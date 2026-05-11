import { Hono } from "hono";

import { type DialogSummary } from "@tomori/shared";

import { requireSessionUser } from "../lib/auth.js";
import { decryptForUser } from "../lib/crypto.js";
import { ok } from "../lib/http.js";
import type { ApiEnv } from "../types.js";

export const exportRoutes = new Hono<ApiEnv>();

exportRoutes.get("/", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const pool = c.get("pool");

  const [moodRows, sleepRows, sessionRows] = await Promise.all([
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
       WHERE user_id = $1
       ORDER BY ts DESC`,
      [sessionUser.id]
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
       WHERE user_id = $1
       ORDER BY date DESC`,
      [sessionUser.id]
    ),
    pool.query<{
      id: string;
      mode: "morning" | "evening" | "talk";
      started_at: Date;
      closed_at: Date | null;
      close_reason: string | null;
      turn_cap: number;
    }>(
      `SELECT id, mode, started_at, closed_at, close_reason, turn_cap
       FROM dialog_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC`,
      [sessionUser.id]
    )
  ]);

  const moods = await Promise.all(
    moodRows.rows.map(async (row) => ({
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

  const dialogSessions = await Promise.all(
    sessionRows.rows.map(async (session) => {
      const turns = await pool.query<{
        turn_index: number;
        role: "user" | "assistant";
        content_cipher: Buffer;
        content_nonce: Buffer;
        dek_id: string;
        alg_version: number;
        ts: Date;
      }>(
        `SELECT turn_index, role, content_cipher, content_nonce, dek_id, alg_version, ts
         FROM dialog_turns
         WHERE session_id = $1
         ORDER BY turn_index ASC`,
        [session.id]
      );

      const summaryRow = await pool.query<{
        summary_cipher: Buffer;
        summary_nonce: Buffer;
        dek_id: string;
        alg_version: number;
      }>(
        `SELECT summary_cipher, summary_nonce, dek_id, alg_version
         FROM dialog_summaries
         WHERE session_id = $1`,
        [session.id]
      );

      const summary = summaryRow.rows[0]
        ? (JSON.parse(
            await decryptForUser(
              pool,
              c.get("kekProvider"),
              sessionUser.id,
              summaryRow.rows[0].dek_id,
              summaryRow.rows[0].summary_cipher,
              summaryRow.rows[0].summary_nonce,
              summaryRow.rows[0].alg_version
            )
          ) as DialogSummary)
        : null;

      return {
        id: session.id,
        mode: session.mode,
        started_at: session.started_at.toISOString(),
        closed_at: session.closed_at?.toISOString() ?? null,
        close_reason: session.close_reason,
        turn_cap: session.turn_cap,
        turns: await Promise.all(
          turns.rows.map(async (turn) => ({
            index: turn.turn_index,
            role: turn.role,
            text: await decryptForUser(
              pool,
              c.get("kekProvider"),
              sessionUser.id,
              turn.dek_id,
              turn.content_cipher,
              turn.content_nonce,
              turn.alg_version
            ),
            ts: turn.ts.toISOString()
          }))
        ),
        summary
      };
    })
  );

  c.header("Content-Type", "application/json; charset=utf-8");
  return c.json(
    ok({
      moods,
      sleepLogs: sleepRows.rows.map((row) => ({
        id: row.id,
        date: row.date,
        bedtime_at: row.bedtime_at?.toISOString() ?? null,
        wake_at: row.wake_at?.toISOString() ?? null,
        quality: row.quality,
        source: row.source
      })),
      dialogSessions
    }).body
  );
});

import { Hono } from "hono";

import { MoodCreateInputSchema, MoodRangeQuerySchema } from "@tomori/shared";

import { requireSessionUser } from "../lib/auth.js";
import { decryptForUser, encryptForUser } from "../lib/crypto.js";
import { parseJson, parseQuery, ok } from "../lib/http.js";
import type { ApiEnv } from "../types.js";

export const moodRoutes = new Hono<ApiEnv>();

moodRoutes.post("/", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const body = await parseJson(c, MoodCreateInputSchema);
  const pool = c.get("pool");

  const encryptedNote =
    body.note && body.note.length > 0
      ? await encryptForUser(pool, c.get("kekProvider"), sessionUser.id, body.note)
      : null;

  const inserted = await pool.query<{
    id: string;
    ts: Date;
  }>(
    `INSERT INTO mood_logs (
       user_id, ts, score, valence, arousal, tags, note_cipher, note_nonce, dek_id, alg_version, source
     ) VALUES (
       $1, COALESCE($2::timestamptz, now()), $3, $4, $5, $6, $7, $8, $9, $10, $11
     )
     RETURNING id, ts`,
    [
      sessionUser.id,
      body.ts ?? null,
      body.score,
      body.valence ?? null,
      body.arousal ?? null,
      body.tags,
      encryptedNote?.ciphertext ?? null,
      encryptedNote?.nonce ?? null,
      encryptedNote?.dekId ?? null,
      encryptedNote?.algVersion ?? 1,
      body.source
    ]
  );

  return c.json(
    ok(
      {
        id: inserted.rows[0]!.id,
        ts: inserted.rows[0]!.ts.toISOString(),
        score: body.score,
        valence: body.valence ?? null,
        arousal: body.arousal ?? null,
        tags: body.tags,
        note: body.note ?? null,
        source: body.source
      },
      201
    ).body,
    201
  );
});

moodRoutes.get("/", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const query = parseQuery(
    {
      from: c.req.query("from"),
      to: c.req.query("to")
    },
    MoodRangeQuerySchema
  );

  const result = await c.get("pool").query<{
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
       AND ts >= $2::date
       AND ts < ($3::date + interval '1 day')
     ORDER BY ts DESC`,
    [sessionUser.id, query.from, query.to]
  );

  const data = await Promise.all(
    result.rows.map(async (row) => ({
      id: row.id,
      ts: row.ts.toISOString(),
      score: row.score,
      valence: row.valence,
      arousal: row.arousal,
      tags: row.tags,
      note:
        row.note_cipher && row.note_nonce && row.dek_id
          ? await decryptForUser(c.get("pool"), c.get("kekProvider"), sessionUser.id, row.dek_id, row.note_cipher, row.note_nonce, row.alg_version)
          : null,
      source: row.source
    }))
  );

  return c.json(ok(data).body);
});

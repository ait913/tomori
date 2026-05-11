import { Hono } from "hono";

import {
  AppError,
  DialogStartInputSchema,
  DialogTurnInputSchema,
  type DialogSummary
} from "@tomori/shared";
import { detectCrisis } from "@tomori/safety";

import { requireSessionUser } from "../lib/auth.js";
import { generateAssistantReply, createAssistantStart, fetchDecryptedTurns, fetchDialogSession, saveDialogSummary, saveEncryptedTurn, TURN_CAPS, type DialogMode, buildMinimalSummary } from "../lib/dialog.js";
import { parseJson, ok } from "../lib/http.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { toTokyoDate } from "../lib/time.js";
import type { ApiEnv } from "../types.js";

export const dialogRoutes = new Hono<ApiEnv>();

dialogRoutes.post("/start", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const body = await parseJson(c, DialogStartInputSchema);
  const pool = c.get("pool");

  const sessionInsert = await pool.query<{ id: string }>(
    `INSERT INTO dialog_sessions (user_id, mode, turn_cap)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [sessionUser.id, body.mode, TURN_CAPS[body.mode]]
  );

  const initial = await createAssistantStart(pool, c.get("kekProvider"), sessionUser.id, body.mode);
  const assistant = await saveEncryptedTurn(pool, c.get("kekProvider"), {
    sessionId: sessionInsert.rows[0]!.id,
    userId: sessionUser.id,
    turnIndex: 0,
    role: "assistant",
    text: initial.text,
    model: initial.model
  });

  return c.json(
    ok({
      session_id: sessionInsert.rows[0]!.id,
      mode: body.mode,
      turn_cap: TURN_CAPS[body.mode],
      assistant
    }).body,
    201
  );
});

dialogRoutes.post("/:id/turn", rateLimit("dialog-turn", 1, 1), async (c) => {
  const sessionUser = await requireSessionUser(c);
  const session = await fetchDialogSession(c.get("pool"), c.req.param("id"), sessionUser.id);
  if (session.closed_at) {
    throw new AppError(409, "SESSION_CLOSED", "Dialog session is already closed");
  }

  const body = await parseJson(c, DialogTurnInputSchema);
  const existingTurns = await fetchDecryptedTurns(c.get("pool"), c.get("kekProvider"), session.id, sessionUser.id);
  const assistantCount = existingTurns.filter((turn) => turn.role === "assistant").length;

  if (assistantCount >= session.turn_cap) {
    throw new AppError(409, "TURN_CAP_REACHED", "Turn cap reached");
  }

  const userTurn = await saveEncryptedTurn(c.get("pool"), c.get("kekProvider"), {
    sessionId: session.id,
    userId: sessionUser.id,
    turnIndex: existingTurns.length,
    role: "user",
    text: body.text
  });

  const crisis = await detectCrisis(body.text);
  if (crisis.hit) {
    await c.get("pool").query(
      `INSERT INTO crisis_events (user_id, session_id, detected_by)
       VALUES ($1, $2, $3)`,
      [sessionUser.id, session.id, crisis.by === "none" ? "regex" : crisis.by]
    );
    await c.get("pool").query(
      `UPDATE dialog_sessions
       SET closed_at = now(), close_reason = 'crisis'
       WHERE id = $1`,
      [session.id]
    );

    const minimal = session.mode === "talk" ? null : buildMinimalSummary({ mode: session.mode, closeReason: "crisis", turnCount: assistantCount });
    if (minimal) {
      await saveDialogSummary(c.get("pool"), c.get("kekProvider"), session.id, sessionUser.id, minimal);
    }

    throw new AppError(409, "CRISIS_HANDOFF", "Crisis detected", {
      kind: "crisis",
      crisis_card: c.get("crisisCard")
    });
  }

  try {
    const reply = await generateAssistantReply({
      pool: c.get("pool"),
      kekProvider: c.get("kekProvider"),
      userId: sessionUser.id,
      sessionId: session.id,
      mode: session.mode as DialogMode,
      userText: userTurn.text,
      assistantCount
    });

    const assistantTurn = await saveEncryptedTurn(c.get("pool"), c.get("kekProvider"), {
      sessionId: session.id,
      userId: sessionUser.id,
      turnIndex: existingTurns.length + 1,
      role: "assistant",
      text: reply.assistantText,
      model: reply.model
    });

    const newAssistantCount = assistantCount + 1;
    const shouldClose = newAssistantCount >= session.turn_cap;

    if (shouldClose) {
      await c.get("pool").query(
        `UPDATE dialog_sessions
         SET closed_at = now(), close_reason = 'turn_cap'
         WHERE id = $1`,
        [session.id]
      );

      if (reply.closingSummary) {
        await saveDialogSummary(c.get("pool"), c.get("kekProvider"), session.id, sessionUser.id, reply.closingSummary);
      }

      const summary =
        reply.closingSummary ??
        (session.mode === "talk"
          ? null
          : buildMinimalSummary({
              mode: session.mode as DialogMode,
              closeReason: "turn_cap",
              turnCount: newAssistantCount
            }));

      return c.json(
        ok({
          kind: "closing",
          assistant: assistantTurn,
          summary
        }).body
      );
    }

    return c.json(
      ok({
        kind: "continue",
        assistant: assistantTurn,
        remaining_turns: session.turn_cap - newAssistantCount
      }).body
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "CRISIS_HANDOFF") {
      await c.get("pool").query(
        `INSERT INTO crisis_events (user_id, session_id, detected_by)
         VALUES ($1, $2, 'classifier')`,
        [sessionUser.id, session.id]
      );
      await c.get("pool").query(
        `UPDATE dialog_sessions
         SET closed_at = now(), close_reason = 'crisis'
         WHERE id = $1`,
        [session.id]
      );
      throw new AppError(409, "CRISIS_HANDOFF", "Crisis detected", {
        kind: "crisis",
        crisis_card: c.get("crisisCard")
      });
    }
    throw error;
  }
});

dialogRoutes.post("/:id/close", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const session = await fetchDialogSession(c.get("pool"), c.req.param("id"), sessionUser.id);
  if (session.closed_at) {
    throw new AppError(409, "SESSION_CLOSED", "Dialog session is already closed");
  }

  const turns = await fetchDecryptedTurns(c.get("pool"), c.get("kekProvider"), session.id, sessionUser.id);
  const assistantCount = turns.filter((turn) => turn.role === "assistant").length;
  let summary: DialogSummary | null = null;
  if (session.mode !== "talk") {
    summary = buildMinimalSummary({
      mode: session.mode as DialogMode,
      closeReason: "user_close",
      turnCount: assistantCount
    });
    await saveDialogSummary(c.get("pool"), c.get("kekProvider"), session.id, sessionUser.id, summary);
  }

  await c.get("pool").query(
    `UPDATE dialog_sessions
     SET closed_at = now(), close_reason = 'user_close'
     WHERE id = $1`,
    [session.id]
  );

  return c.json(ok({ closed: true, summary }).body);
});

dialogRoutes.get("/:id", async (c) => {
  const sessionUser = await requireSessionUser(c);
  const session = await fetchDialogSession(c.get("pool"), c.req.param("id"), sessionUser.id);
  const turns = await fetchDecryptedTurns(c.get("pool"), c.get("kekProvider"), session.id, sessionUser.id);
  const summaryRow = await c.get("pool").query<{
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

  let summary: DialogSummary | null = null;
  const row = summaryRow.rows[0];
  if (row) {
    const decrypted = await c
      .get("pool")
      .query<{ value: string }>(
        `SELECT $1::text AS value`,
        [
          await (await import("../lib/crypto.js")).decryptForUser(
            c.get("pool"),
            c.get("kekProvider"),
            sessionUser.id,
            row.dek_id,
            row.summary_cipher,
            row.summary_nonce,
            row.alg_version
          )
        ]
      );
    summary = JSON.parse(decrypted.rows[0]!.value) as DialogSummary;
  }

  return c.json(
    ok({
      id: session.id,
      mode: session.mode,
      started_at: session.started_at.toISOString(),
      closed_at: session.closed_at?.toISOString() ?? null,
      close_reason: session.close_reason,
      turn_cap: session.turn_cap,
      turns,
      summary
    }).body
  );
});

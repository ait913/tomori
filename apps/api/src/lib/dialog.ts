import type { Pool } from "pg";

import {
  DEFAULT_MODEL,
  SYSTEM_PROMPT_EVENING_JA,
  SYSTEM_PROMPT_MORNING_JA,
  SYSTEM_PROMPT_TALK_JA,
  TOOL_SAVE_SUMMARY,
  buildContext,
  maskPII,
  runLLM
} from "@tomori/llm";
import {
  AppError,
  DialogSummarySchema,
  type DialogSummary,
  type DialogTurnView,
  type MoodLogView,
  type SleepLogView
} from "@tomori/shared";

import { decryptForUser, encryptForUser } from "./crypto.js";
import { toTokyoDate, toTokyoTime } from "./time.js";
import type { ApiEnv } from "../types.js";

export const TURN_CAPS = {
  morning: 3,
  evening: 5,
  talk: 10
} as const;

export type DialogMode = keyof typeof TURN_CAPS;

type DialogRow = {
  id: string;
  user_id: string;
  mode: DialogMode;
  started_at: Date;
  closed_at: Date | null;
  close_reason: string | null;
  turn_cap: number;
};

type TurnRow = {
  turn_index: number;
  role: "user" | "assistant";
  content_cipher: Buffer;
  content_nonce: Buffer;
  dek_id: string;
  alg_version: number;
  ts: Date;
};

function systemPromptForMode(mode: DialogMode, crisisRecently: boolean): string {
  const prepend = crisisRecently ? "直近で危険な兆候があったことを認識し、落ち着いた声掛けから始めて。\n\n" : "";
  switch (mode) {
    case "morning":
      return `${prepend}${SYSTEM_PROMPT_MORNING_JA}`;
    case "evening":
      return `${prepend}${SYSTEM_PROMPT_EVENING_JA}`;
    case "talk":
      return `${prepend}${SYSTEM_PROMPT_TALK_JA}`;
  }
}

export async function recentCrisisWithin30Minutes(pool: Pool, userId: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM crisis_events
       WHERE user_id = $1
         AND ts >= now() - interval '30 minutes'
     ) AS exists`,
    [userId]
  );
  return result.rows[0]?.exists ?? false;
}

export async function fetchDialogSession(pool: Pool, sessionId: string, userId: string): Promise<DialogRow> {
  const result = await pool.query<DialogRow>(
    `SELECT id, user_id, mode, started_at, closed_at, close_reason, turn_cap
     FROM dialog_sessions
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  const session = result.rows[0];
  if (!session) {
    throw new AppError(404, "NOT_FOUND", "Dialog session not found");
  }
  return session;
}

export async function fetchDecryptedTurns(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  sessionId: string,
  userId: string
): Promise<DialogTurnView[]> {
  const result = await pool.query<TurnRow>(
    `SELECT turn_index, role, content_cipher, content_nonce, dek_id, alg_version, ts
     FROM dialog_turns
     WHERE session_id = $1 AND user_id = $2
     ORDER BY turn_index ASC`,
    [sessionId, userId]
  );

  const turns = await Promise.all(
    result.rows.map(async (row) => ({
      index: row.turn_index,
      role: row.role,
      text: await decryptForUser(pool, kekProvider, userId, row.dek_id, row.content_cipher, row.content_nonce, row.alg_version),
      ts: row.ts.toISOString()
    }))
  );

  return turns;
}

async function fetchTodaySleep(pool: Pool, userId: string): Promise<SleepLogView | undefined> {
  const today = toTokyoDate(new Date());
  const result = await pool.query<{
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
    [userId, today]
  );

  const row = result.rows[0];
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    date: row.date,
    bedtime_at: row.bedtime_at?.toISOString() ?? null,
    wake_at: row.wake_at?.toISOString() ?? null,
    quality: row.quality,
    source: row.source
  };
}

async function fetchTodayMood(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  userId: string
): Promise<MoodLogView[]> {
  const today = toTokyoDate(new Date());
  const result = await pool.query<{
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
       AND (ts AT TIME ZONE 'Asia/Tokyo')::date = $2::date
     ORDER BY ts DESC`,
    [userId, today]
  );

  return Promise.all(
    result.rows.map(async (row) => ({
      id: row.id,
      ts: row.ts.toISOString(),
      score: row.score,
      valence: row.valence,
      arousal: row.arousal,
      tags: row.tags,
      note:
        row.note_cipher && row.note_nonce && row.dek_id
          ? await decryptForUser(pool, kekProvider, userId, row.dek_id, row.note_cipher, row.note_nonce, row.alg_version)
          : null,
      source: row.source
    }))
  );
}

async function fetchRecentSummaries(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  userId: string
): Promise<DialogSummary[]> {
  const result = await pool.query<{
    summary_cipher: Buffer;
    summary_nonce: Buffer;
    dek_id: string;
    alg_version: number;
  }>(
    `SELECT summary_cipher, summary_nonce, dek_id, alg_version
     FROM dialog_summaries
     WHERE user_id = $1
       AND ts >= now() - interval '14 days'
     ORDER BY ts DESC
     LIMIT 14`,
    [userId]
  );

  const summaries = await Promise.all(
    result.rows.map(async (row) =>
      DialogSummarySchema.parse(
        JSON.parse(
          await decryptForUser(pool, kekProvider, userId, row.dek_id, row.summary_cipher, row.summary_nonce, row.alg_version)
        )
      )
    )
  );

  return summaries;
}

async function fetchRecentTurnsForContext(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  userId: string
): Promise<{ role: "user" | "assistant"; text: string; ts: string }[]> {
  const result = await pool.query<TurnRow>(
    `SELECT turn_index, role, content_cipher, content_nonce, dek_id, alg_version, ts
     FROM dialog_turns
     WHERE user_id = $1
       AND ts >= now() - interval '7 days'
     ORDER BY ts DESC
     LIMIT 30`,
    [userId]
  );

  return Promise.all(
    result.rows.map(async (row) => ({
      role: row.role,
      text: await decryptForUser(pool, kekProvider, userId, row.dek_id, row.content_cipher, row.content_nonce, row.alg_version),
      ts: `${toTokyoDate(row.ts)} ${toTokyoTime(row.ts)}`
    }))
  );
}

export async function createAssistantStart(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  userId: string,
  mode: DialogMode
): Promise<{ text: string; model: string }> {
  const [recentTurns, recentSummaries, todaySleep, todayMood, crisisRecently] = await Promise.all([
    fetchRecentTurnsForContext(pool, kekProvider, userId),
    fetchRecentSummaries(pool, kekProvider, userId),
    fetchTodaySleep(pool, userId),
    fetchTodayMood(pool, kekProvider, userId),
    recentCrisisWithin30Minutes(pool, userId)
  ]);

  const context = buildContext({
    recentTurns: recentTurns.map((turn) => ({ ...turn, text: maskPII(turn.text) })),
    recentSummaries,
    todaySleep,
    todayMood
  });

  const result = await runLLM({
    model: DEFAULT_MODEL,
    systemPrompt: systemPromptForMode(mode, crisisRecently),
    messages: [
      { role: context.role, content: maskPII(context.content) },
      {
        role: "user",
        content:
          mode === "morning"
            ? "朝の対話を開始して、最初の短い声掛けをしてください。"
            : mode === "evening"
              ? "夜の対話を開始して、最初の短い問いかけをしてください。"
              : "相談モードを開始して、最初の短い声掛けをしてください。"
      }
    ],
    maxTokens: 160
  });

  return { text: result.text, model: result.model };
}

export async function saveEncryptedTurn(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  input: {
    sessionId: string;
    userId: string;
    turnIndex: number;
    role: "user" | "assistant";
    text: string;
    model?: string | null;
  }
): Promise<DialogTurnView> {
  const encrypted = await encryptForUser(pool, kekProvider, input.userId, input.text);
  const result = await pool.query<{ ts: Date }>(
    `INSERT INTO dialog_turns (
       session_id, user_id, turn_index, role, content_cipher, content_nonce, dek_id, alg_version, model
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ts`,
    [
      input.sessionId,
      input.userId,
      input.turnIndex,
      input.role,
      encrypted.ciphertext,
      encrypted.nonce,
      encrypted.dekId,
      encrypted.algVersion,
      input.model ?? null
    ]
  );

  return {
    index: input.turnIndex,
    role: input.role,
    text: input.text,
    ts: result.rows[0]!.ts.toISOString()
  };
}

export function buildMinimalSummary(opts: {
  mode: DialogMode;
  closeReason: "turn_cap" | "user_close" | "crisis" | "idle_timeout";
  turnCount: number;
  assistantText?: string;
}): DialogSummary {
  return {
    date: toTokyoDate(new Date()),
    mode: opts.mode,
    sentiment_score: 0,
    top_emotions: [],
    key_events: [],
    insights: opts.mode === "evening" ? "生成失敗" : "",
    unresolved_concerns: "",
    action_item_tomorrow: opts.mode === "morning" ? opts.assistantText ?? "" : "",
    turn_count: opts.turnCount,
    closed_by: opts.closeReason
  };
}

export async function saveDialogSummary(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  sessionId: string,
  userId: string,
  summary: DialogSummary
): Promise<void> {
  const encrypted = await encryptForUser(pool, kekProvider, userId, JSON.stringify(summary));
  await pool.query(
    `INSERT INTO dialog_summaries (
       session_id, user_id, date, summary_cipher, summary_nonce, dek_id, alg_version
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (session_id) DO UPDATE
     SET date = EXCLUDED.date,
         summary_cipher = EXCLUDED.summary_cipher,
         summary_nonce = EXCLUDED.summary_nonce,
         dek_id = EXCLUDED.dek_id,
         alg_version = EXCLUDED.alg_version`,
    [
      sessionId,
      userId,
      summary.date,
      encrypted.ciphertext,
      encrypted.nonce,
      encrypted.dekId,
      encrypted.algVersion
    ]
  );
}

export async function generateAssistantReply(opts: {
  pool: Pool;
  kekProvider: ApiEnv["Variables"]["kekProvider"];
  userId: string;
  sessionId: string;
  mode: DialogMode;
  userText: string;
  assistantCount: number;
}): Promise<{
  assistantText: string;
  model: string;
  closingSummary: DialogSummary | null;
}> {
  const [recentTurns, recentSummaries, todaySleep, todayMood, sessionTurns] = await Promise.all([
    fetchRecentTurnsForContext(opts.pool, opts.kekProvider, opts.userId),
    fetchRecentSummaries(opts.pool, opts.kekProvider, opts.userId),
    fetchTodaySleep(opts.pool, opts.userId),
    fetchTodayMood(opts.pool, opts.kekProvider, opts.userId),
    fetchDecryptedTurns(opts.pool, opts.kekProvider, opts.sessionId, opts.userId)
  ]);

  const context = buildContext({
    recentTurns: recentTurns.map((turn) => ({ ...turn, text: maskPII(turn.text) })),
    recentSummaries,
    todaySleep,
    todayMood
  });

  const messages = [
    { role: context.role, content: maskPII(context.content) as string },
    ...sessionTurns.map((turn) => ({
      role: turn.role,
      content: turn.role === "user" ? maskPII(turn.text) : turn.text
    })),
    { role: "user" as const, content: maskPII(opts.userText) }
  ];

  const isClosingTurn = opts.assistantCount + 1 >= TURN_CAPS[opts.mode];
  const llmResult = await runLLM({
    systemPrompt: systemPromptForMode(opts.mode, false),
    messages,
    maxTokens: opts.mode === "talk" ? 256 : 220,
    toolDefinitions: opts.mode === "evening" ? [TOOL_SAVE_SUMMARY] : undefined
  });

  if (llmResult.text === "[CRISIS_DETECTED_BY_MODEL]") {
    throw new AppError(409, "CRISIS_HANDOFF", "LLM escalated crisis");
  }

  if (!isClosingTurn) {
    return {
      assistantText: llmResult.text || "続きを聞かせて。",
      model: llmResult.model,
      closingSummary: null
    };
  }

  if (opts.mode === "morning") {
    const summary = buildMinimalSummary({
      mode: "morning",
      closeReason: "turn_cap",
      turnCount: opts.assistantCount + 1,
      assistantText: llmResult.text
    });
    return {
      assistantText: llmResult.text,
      model: llmResult.model,
      closingSummary: summary
    };
  }

  if (opts.mode === "talk") {
    return {
      assistantText: llmResult.text,
      model: llmResult.model,
      closingSummary: null
    };
  }

  const validatedSummary = await resolveEveningSummary({
    messages,
    primaryText: llmResult.text,
    primaryToolInput: llmResult.toolUse?.name === "save_summary" ? llmResult.toolUse.input : null
  });

  return {
    assistantText: validatedSummary.assistantText,
    model: llmResult.model,
    closingSummary: validatedSummary.summary
  };
}

async function resolveEveningSummary(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  primaryText: string;
  primaryToolInput: Record<string, unknown> | null;
}): Promise<{ assistantText: string; summary: DialogSummary }> {
  let toolInput = opts.primaryToolInput;
  let assistantText = opts.primaryText;

  const parseCandidate = async (candidate: Record<string, unknown> | null): Promise<DialogSummary | null> => {
    if (!candidate) {
      return null;
    }

    const shape = DialogSummarySchema.omit({
      date: true,
      mode: true,
      turn_count: true,
      closed_by: true
    }).safeParse(candidate);

    if (!shape.success) {
      return null;
    }

    return {
      date: toTokyoDate(new Date()),
      mode: "evening",
      turn_count: 5,
      closed_by: "turn_cap",
      ...shape.data,
      unresolved_concerns: shape.data.unresolved_concerns.slice(0, 80),
      action_item_tomorrow: shape.data.action_item_tomorrow.slice(0, 80),
      insights: shape.data.insights.slice(0, 120)
    };
  };

  let parsed = await parseCandidate(toolInput);

  if (!parsed) {
    const retry = await runLLM({
      systemPrompt: SYSTEM_PROMPT_EVENING_JA,
      messages: opts.messages,
      maxTokens: 220,
      toolDefinitions: [TOOL_SAVE_SUMMARY],
      toolChoice: { type: "tool", name: "save_summary" }
    });
    toolInput = retry.toolUse?.name === "save_summary" ? retry.toolUse.input : null;
    if (!assistantText) {
      assistantText = retry.text;
    }
    parsed = await parseCandidate(toolInput);
  }

  if (!assistantText) {
    const closing = await runLLM({
      systemPrompt: SYSTEM_PROMPT_EVENING_JA,
      messages: [...opts.messages, { role: "assistant", content: "ここまでをまとめて保存した。最後の一言だけ返して。" }],
      maxTokens: 80
    });
    assistantText = closing.text || "ここまでをまとめて保存したよ。今日はここまで。";
  }

  return {
    assistantText,
    summary:
      parsed ??
      buildMinimalSummary({
        mode: "evening",
        closeReason: "turn_cap",
        turnCount: 5
      })
  };
}

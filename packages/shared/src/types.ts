import { z } from "zod";

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "CRISIS_HANDOFF"
  | "TURN_CAP_REACHED"
  | "SESSION_CLOSED"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "LLM_TIMEOUT";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: AppErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type MoodLogView = {
  id: string;
  ts: string;
  score: 1 | 2 | 3 | 4 | 5;
  valence: number | null;
  arousal: number | null;
  tags: string[];
  note: string | null;
  source: string;
};

export type SleepLogView = {
  id: string;
  date: string;
  bedtime_at: string | null;
  wake_at: string | null;
  quality: number | null;
  source: string;
};

export const DialogSummarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["morning", "evening", "talk"]),
  sentiment_score: z.number().min(-1).max(1),
  top_emotions: z.array(z.string()).max(5),
  key_events: z.array(z.string()).max(5),
  insights: z.string().max(120),
  unresolved_concerns: z.string().max(80),
  action_item_tomorrow: z.string().max(80),
  turn_count: z.number().int().min(0),
  closed_by: z.enum(["turn_cap", "user_close", "crisis", "idle_timeout"])
});

export type DialogSummary = z.infer<typeof DialogSummarySchema>;

export type DialogTurnView = {
  index: number;
  role: "user" | "assistant";
  text: string;
  ts: string;
};

export type DialogStartResult = {
  session_id: string;
  mode: "morning" | "evening" | "talk";
  turn_cap: number;
  assistant: DialogTurnView;
};

export type CrisisCard = {
  title: string;
  hotlines: { label: string; tel: string }[];
  message: string;
};

export type DialogTurnResult =
  | { kind: "continue"; assistant: DialogTurnView; remaining_turns: number }
  | { kind: "closing"; assistant: DialogTurnView; summary: DialogSummary | null }
  | { kind: "crisis"; crisis_card: CrisisCard };

export type HistoryResult = {
  mood: MoodLogView[];
  sleep: SleepLogView | null;
  summaries: DialogSummary[];
};

export type ExportPayload = {
  moods: MoodLogView[];
  sleepLogs: SleepLogView[];
  dialogSessions: {
    id: string;
    mode: "morning" | "evening" | "talk";
    started_at: string;
    closed_at: string | null;
    close_reason: string | null;
    turn_cap: number;
    turns: DialogTurnView[];
    summary: DialogSummary | null;
  }[];
};

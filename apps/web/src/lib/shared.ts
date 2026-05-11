export const MOOD_TAGS = [
  "work",
  "study",
  "social",
  "isolation",
  "exercise",
  "walk",
  "sleep_well",
  "sleep_poor",
  "food",
  "caffeine",
  "alcohol",
  "creative",
  "reading",
  "gaming",
  "family",
  "partner",
  "friend",
  "anxiety",
  "focus_high",
  "fatigue",
  "morning_dialog",
  "evening_dialog"
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

export type MoodCreateInput = {
  ts?: string;
  score: 1 | 2 | 3 | 4 | 5;
  valence?: number;
  arousal?: number;
  tags: MoodTag[];
  note?: string;
  source: "manual" | "evening_dialog" | "morning_dialog";
};

export type MoodLogView = {
  id: string;
  ts: string;
  score: 1 | 2 | 3 | 4 | 5;
  valence: number | null;
  arousal: number | null;
  tags: MoodTag[];
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

export type DialogSummary = {
  date: string;
  mode: "morning" | "evening" | "talk";
  sentiment_score: number;
  top_emotions: string[];
  key_events: string[];
  insights: string;
  unresolved_concerns: string;
  action_item_tomorrow: string;
  turn_count: number;
  closed_by: "turn_cap" | "user_close" | "crisis" | "idle_timeout";
};

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

export type ApiFailure = {
  ok: false;
  error: {
    code:
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
    message: string;
    details?: unknown;
  };
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

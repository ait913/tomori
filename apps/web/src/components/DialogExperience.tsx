"use client";

import { useEffect, useRef, useState } from "react";

import type {
  CrisisCard,
  DialogStartResult,
  DialogSummary,
  DialogTurnResult,
  DialogTurnView
} from "@tomori/shared";

import { apiClient, ApiClientError } from "@/lib/api-client";
import { Character } from "@/components/Character";
import { ChatTurn } from "@/components/ChatTurn";
import { useToast } from "@/components/providers";
import { useAppStore, type DialogMode, type OrbState } from "@/store/app";

function mapModeToOrb(mode: DialogMode, streaming: boolean): Exclude<OrbState, "crisis"> {
  if (streaming) {
    return "talking";
  }
  if (mode === "morning") {
    return "morning";
  }
  if (mode === "talk") {
    return "idle";
  }
  return "evening";
}

type DialogExperienceProps = {
  mode: DialogMode;
  title: string;
  description: string;
  startFields?: React.ReactNode;
  onBeforeStart?: () => Promise<void>;
  startLabel: string;
  afterCloseText?: string;
};

export function DialogExperience({
  mode,
  title,
  description,
  startFields,
  onBeforeStart,
  startLabel,
  afterCloseText
}: DialogExperienceProps) {
  const { showToast } = useToast();
  const session = useAppStore((state) => state.dialogSession);
  const setDialogSession = useAppStore((state) => state.setDialogSession);
  const setDialogStatus = useAppStore((state) => state.setDialogStatus);
  const appendTurn = useAppStore((state) => state.appendTurn);
  const openCrisisCard = useAppStore((state) => state.openCrisisCard);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<DialogSummary | null>(null);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeSession = session && session.mode === mode ? session : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.turns, summary]);

  async function startDialog() {
    setError(null);
    setClosed(false);
    setSummary(null);
    setStarting(true);

    try {
      if (onBeforeStart) {
        await onBeforeStart();
      }
      const data = await apiClient.post<DialogStartResult>("/api/dialog/start", { mode });
      setDialogSession({
        id: data.session_id,
        mode,
        turns: [data.assistant],
        status: "idle"
      });
      showToast("対話を始めました");
    } catch (caught) {
      if (caught instanceof Error) {
        setError(caught.message);
      }
    } finally {
      setStarting(false);
    }
  }

  async function closeDialog() {
    if (!activeSession) {
      return;
    }
    setSubmitting(true);
    setDialogStatus("closing");
    try {
      const result = await apiClient.post<{ closed: boolean; summary: DialogSummary | null }>(
        `/api/dialog/${activeSession.id}/close`,
        { reason: "user_close" }
      );
      setClosed(true);
      setSummary(result.summary);
      setDialogStatus("closed");
      showToast("保存しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendTurn() {
    if (!activeSession || input.trim().length === 0) {
      return;
    }

    const currentInput = input.trim();
    const optimisticUserTurn: DialogTurnView = {
      index: activeSession.turns.length,
      role: "user",
      text: currentInput,
      ts: new Date().toISOString()
    };

    appendTurn(optimisticUserTurn);
    setInput("");
    setSubmitting(true);
    setDialogStatus("streaming");
    setError(null);

    try {
      const result = await apiClient.post<DialogTurnResult>(`/api/dialog/${activeSession.id}/turn`, { text: currentInput });

      if (result.kind === "continue") {
        appendTurn(result.assistant);
        setDialogStatus("idle");
        return;
      }

      if (result.kind === "closing") {
        appendTurn(result.assistant);
        setDialogStatus("closed");
        setClosed(true);
        setSummary(result.summary);
        showToast("保存しました");
      }
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.payload?.code === "CRISIS_HANDOFF") {
        const details = caught.payload.details as { crisis_card?: CrisisCard } | undefined;
        if (details?.crisis_card) {
          openCrisisCard(details.crisis_card);
        }
        setDialogStatus("closed");
        setClosed(true);
        return;
      }

      setError(caught instanceof Error ? caught.message : "送信に失敗しました");
      setDialogStatus("idle");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
        <Character size={168} state={mapModeToOrb(mode, activeSession?.status === "streaming")} />
        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-tomori-muted-light dark:text-tomori-muted-dark">{description}</p>
        </div>
      </section>

      {!activeSession ? (
        <section className="space-y-4 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
          {startFields}
          <button
            className="w-full rounded-full bg-tomori-accent-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            disabled={starting}
            onClick={() => void startDialog()}
            type="button"
          >
            {starting ? "準備中…" : startLabel}
          </button>
          {error ? <p className="text-sm text-tomori-danger-500">{error}</p> : null}
        </section>
      ) : (
        <section className="space-y-4 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1" ref={scrollRef}>
            {activeSession.turns.map((turn) => (
              <ChatTurn key={`${turn.index}-${turn.role}`} role={turn.role} text={turn.text} ts={turn.ts} />
            ))}
          </div>
          {summary ? (
            <div className="rounded-2xl border border-tomori-accent-100 bg-tomori-accent-50 p-4 dark:border-tomori-accent-700/50 dark:bg-[rgba(240,160,48,0.1)]">
              <div className="text-sm font-semibold">summary</div>
              <div className="mt-2 text-sm">sentiment {summary.sentiment_score}</div>
              <div className="mt-1 text-sm">key: {summary.key_events.join(" / ") || "なし"}</div>
              <div className="mt-1 text-sm">insights: {summary.insights || "なし"}</div>
              {afterCloseText ? <div className="mt-3 text-xs text-tomori-muted-light dark:text-tomori-muted-dark">{afterCloseText}</div> : null}
            </div>
          ) : null}
          {closed ? (
            <button
              className="w-full rounded-full border border-tomori-accent-100 px-4 py-3 text-sm font-semibold dark:border-tomori-accent-700/50"
              onClick={() => {
                setDialogSession(null);
                setSummary(null);
                setClosed(false);
              }}
              type="button"
            >
              新しく始める
            </button>
          ) : (
            <>
              <div className="flex gap-2">
                <textarea
                  className="min-h-24 flex-1 rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
                  maxLength={2000}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="返事を書く"
                  value={input}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-full bg-tomori-accent-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={submitting || input.trim().length === 0}
                  onClick={() => void sendTurn()}
                  type="button"
                >
                  {submitting ? "送信中…" : "送信"}
                </button>
                <button
                  className="rounded-full border border-tomori-accent-100 px-4 py-3 text-sm font-semibold dark:border-tomori-accent-700/50"
                  disabled={submitting}
                  onClick={() => void closeDialog()}
                  type="button"
                >
                  閉じる
                </button>
              </div>
            </>
          )}
          {error ? <p className="text-sm text-tomori-danger-500">{error}</p> : null}
        </section>
      )}
    </div>
  );
}

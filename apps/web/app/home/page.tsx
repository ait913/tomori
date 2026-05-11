"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { HistoryResult } from "@tomori/shared";

import { Character } from "@/components/Character";
import { PageFrame } from "@/components/PageFrame";
import { apiClient } from "@/lib/api-client";
import { formatDateTime, tokyoToday } from "@/lib/date";

function stateCopy() {
  const hour = Number(
    new Intl.DateTimeFormat("ja-JP", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Tokyo"
    }).format(new Date())
  );
  if (hour < 11) {
    return "おはよう。起動しただけでえらい。";
  }
  if (hour < 18) {
    return "昼の空気。次の一手だけ決めれば十分。";
  }
  return "おつかれさま。今日はどう動いたかだけ見よう。";
}

const PRIMARY_ACTIONS = [
  { href: "/dialog/morning", label: "朝の対話" },
  { href: "/dialog/night", label: "夜の対話" },
  { href: "/mood", label: "気分を記録" },
  { href: "/dialog/chat", label: "AI に相談" }
];

const SECONDARY_ACTIONS = [
  { href: "/sleep", label: "睡眠を記録" },
  { href: "/history", label: "履歴を見る" }
];

export default function HomePage() {
  const [todayDigest, setTodayDigest] = useState<HistoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await apiClient.get<HistoryResult>(`/api/history?date=${tokyoToday()}`);
        if (!cancelled) {
          setTodayDigest(result);
        }
      } catch (caught) {
        if (!cancelled && caught instanceof Error) {
          setError(caught.message);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageFrame title="home">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
        <Character size={192} state="idle" />
        <p className="mt-4 text-center text-xl font-semibold">「{stateCopy()}」</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {PRIMARY_ACTIONS.map((action) => (
          <Link
            key={action.href}
            className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-5 text-sm font-semibold shadow-glow backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]"
            href={action.href}
          >
            {action.label}
          </Link>
        ))}
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3">
        {SECONDARY_ACTIONS.map((action) => (
          <Link
            key={action.href}
            className="rounded-[24px] border border-dashed border-tomori-accent-100 bg-[rgba(255,255,255,0.55)] px-4 py-4 text-sm font-medium backdrop-blur dark:border-tomori-accent-700/50 dark:bg-[rgba(42,37,33,0.58)]"
            href={action.href}
          >
            {action.label}
          </Link>
        ))}
      </section>

      <section className="mt-5 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">今日のログ</h2>
          <Link className="text-sm text-tomori-muted-light dark:text-tomori-muted-dark" href={`/history?date=${tokyoToday()}`}>
            詳細
          </Link>
        </div>

        {error ? <p className="mt-3 text-sm text-tomori-danger-500">{error}</p> : null}

        <div className="mt-4 space-y-3 text-sm">
          {todayDigest?.mood.map((entry) => (
            <div className="flex items-start justify-between rounded-2xl bg-tomori-accent-50 px-4 py-3 dark:bg-[rgba(240,160,48,0.1)]" key={entry.id}>
              <span>{formatDateTime(entry.ts)}</span>
              <span>mood {entry.score}</span>
              <span>{entry.tags[0] ?? "untagged"}</span>
            </div>
          ))}
          {todayDigest?.summaries.map((summary, index) => (
            <div
              className="rounded-2xl border border-tomori-accent-100 px-4 py-3 dark:border-tomori-accent-700/50"
              key={`${summary.date}-${summary.mode}-${index}`}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-tomori-muted-light dark:text-tomori-muted-dark">{summary.mode}</div>
              <div className="mt-1 text-sm">sentiment {summary.sentiment_score}</div>
              <div className="mt-1 text-sm">{summary.insights || "まとめなし"}</div>
            </div>
          ))}
          {!todayDigest || (todayDigest.mood.length === 0 && todayDigest.summaries.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-tomori-accent-100 px-4 py-5 text-sm text-tomori-muted-light dark:border-tomori-accent-700/50 dark:text-tomori-muted-dark">
              まだ記録がありません。
            </div>
          ) : null}
        </div>
      </section>
    </PageFrame>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { HistoryResult } from "@tomori/shared";

import { PageFrame } from "@/components/PageFrame";
import { apiClient } from "@/lib/api-client";
import { formatDateOnly, formatDateTime, tokyoToday } from "@/lib/date";

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(searchParams.get("date") ?? tokyoToday());
  const [data, setData] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextDate = searchParams.get("date") ?? tokyoToday();
    setDate(nextDate);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<HistoryResult>(`/api/history?date=${date}`);
        if (!cancelled) {
          setData(result);
        }
      } catch (caught) {
        if (!cancelled && caught instanceof Error) {
          setError(caught.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <PageFrame title="履歴">
      <section className="space-y-5 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
        <label className="block text-sm">
          <span className="mb-2 block font-medium">対象日</span>
          <input
            className="w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
            onChange={(event) => {
              const nextDate = event.target.value;
              setDate(nextDate);
              router.replace(`/history?date=${nextDate}`);
            }}
            type="date"
            value={date}
          />
        </label>

        {loading ? <p className="text-sm text-tomori-muted-light dark:text-tomori-muted-dark">読み込み中…</p> : null}
        {error ? <p className="text-sm text-tomori-danger-500">{error}</p> : null}

        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">mood</h2>
            <div className="mt-3 space-y-3">
              {data?.mood.map((item) => (
                <div className="rounded-2xl border border-tomori-accent-100 p-4 dark:border-tomori-accent-700/50" key={item.id}>
                  <div className="text-sm font-medium">{formatDateTime(item.ts)} / score {item.score}</div>
                  <div className="mt-1 text-sm text-tomori-muted-light dark:text-tomori-muted-dark">{item.tags.join(", ") || "タグなし"}</div>
                  {item.note ? <p className="mt-2 text-sm leading-6">{item.note}</p> : null}
                </div>
              ))}
              {!data || data.mood.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-tomori-accent-100 p-4 text-sm text-tomori-muted-light dark:border-tomori-accent-700/50 dark:text-tomori-muted-dark">
                  mood はありません。
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">sleep</h2>
            <div className="mt-3 rounded-2xl border border-tomori-accent-100 p-4 dark:border-tomori-accent-700/50">
              {data?.sleep ? (
                <>
                  <div className="text-sm">{formatDateOnly(data.sleep.date)}</div>
                  <div className="mt-1 text-sm">bed {data.sleep.bedtime_at ? formatDateTime(data.sleep.bedtime_at) : "—"}</div>
                  <div className="mt-1 text-sm">wake {data.sleep.wake_at ? formatDateTime(data.sleep.wake_at) : "—"}</div>
                  <div className="mt-1 text-sm">quality {data.sleep.quality ?? "—"}</div>
                </>
              ) : (
                <div className="text-sm text-tomori-muted-light dark:text-tomori-muted-dark">sleep はありません。</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">summary</h2>
            <div className="mt-3 space-y-3">
              {data?.summaries.map((item, index) => (
                <div className="rounded-2xl border border-tomori-accent-100 p-4 dark:border-tomori-accent-700/50" key={`${item.date}-${item.mode}-${index}`}>
                  <div className="text-sm font-medium">
                    {item.mode} / sentiment {item.sentiment_score}
                  </div>
                  <div className="mt-2 text-sm">emotions: {item.top_emotions.join(", ") || "なし"}</div>
                  <div className="mt-1 text-sm">events: {item.key_events.join(", ") || "なし"}</div>
                  <div className="mt-1 text-sm">insights: {item.insights || "なし"}</div>
                  <div className="mt-1 text-sm">tomorrow: {item.action_item_tomorrow || "なし"}</div>
                </div>
              ))}
              {!data || data.summaries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-tomori-accent-100 p-4 text-sm text-tomori-muted-light dark:border-tomori-accent-700/50 dark:text-tomori-muted-dark">
                  summary はありません。
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

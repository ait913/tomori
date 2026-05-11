"use client";

import { useEffect, useState } from "react";

import type { SleepLogView } from "@tomori/shared";

import { PageFrame } from "@/components/PageFrame";
import { useToast } from "@/components/providers";
import { apiClient } from "@/lib/api-client";
import { combineDateAndTime, tokyoToday } from "@/lib/date";

export default function SleepPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState(tokyoToday());
  const [bedtimeAt, setBedtimeAt] = useState("23:45");
  const [wakeAt, setWakeAt] = useState("07:30");
  const [quality, setQuality] = useState("3");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const result = await apiClient.get<SleepLogView | null>(`/api/sleep?date=${date}`);
        if (!result || cancelled) {
          return;
        }
        setBedtimeAt(result.bedtime_at ? new Date(result.bedtime_at).toISOString().slice(11, 16) : "23:45");
        setWakeAt(result.wake_at ? new Date(result.wake_at).toISOString().slice(11, 16) : "07:30");
        setQuality(String(result.quality ?? 3));
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

  async function onSave() {
    setSaving(true);
    try {
      await apiClient.post("/api/sleep", {
        date,
        bedtime_at: combineDateAndTime(date, bedtimeAt),
        wake_at: combineDateAndTime(date, wakeAt),
        quality: Number(quality)
      });
      showToast("保存しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFrame title="睡眠報告">
      <section className="space-y-5 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
        <label className="block text-sm">
          <span className="mb-2 block font-medium">日付</span>
          <input
            className="w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium">就寝時刻</span>
          <input
            className="w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
            onChange={(event) => setBedtimeAt(event.target.value)}
            type="time"
            value={bedtimeAt}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium">起床時刻</span>
          <input
            className="w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
            onChange={(event) => setWakeAt(event.target.value)}
            type="time"
            value={wakeAt}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium">睡眠の質</span>
          <select
            className="w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
            onChange={(event) => setQuality(event.target.value)}
            value={quality}
          >
            {[1, 2, 3, 4, 5].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          className="w-full rounded-full bg-tomori-accent-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          disabled={saving || loading}
          onClick={() => void onSave()}
          type="button"
        >
          {loading ? "読込中…" : saving ? "保存中…" : "保存"}
        </button>
      </section>
    </PageFrame>
  );
}

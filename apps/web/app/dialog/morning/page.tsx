"use client";

import { useState } from "react";

import { DialogExperience } from "@/components/DialogExperience";
import { PageFrame } from "@/components/PageFrame";
import { apiClient } from "@/lib/api-client";
import { combineDateAndTime, tokyoToday } from "@/lib/date";

export default function MorningDialogPage() {
  const [date] = useState(tokyoToday());
  const [wakeAt, setWakeAt] = useState("07:30");
  const [bedtimeAt, setBedtimeAt] = useState("23:50");
  const [quality, setQuality] = useState("3");

  return (
    <PageFrame title="朝の対話">
      <DialogExperience
        description="起床報告のあと、1-3 ターンで軽く整えます。"
        mode="morning"
        onBeforeStart={async () => {
          await apiClient.post("/api/sleep", {
            date,
            wake_at: combineDateAndTime(date, wakeAt),
            bedtime_at: combineDateAndTime(date, bedtimeAt),
            quality: Number(quality)
          });
        }}
        startFields={
          <div className="space-y-4">
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
              <span className="mb-2 block font-medium">就寝時刻</span>
              <input
                className="w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
                onChange={(event) => setBedtimeAt(event.target.value)}
                type="time"
                value={bedtimeAt}
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
          </div>
        }
        startLabel="対話を始める"
        title="おはよう。今、何時に起きた?"
      />
    </PageFrame>
  );
}

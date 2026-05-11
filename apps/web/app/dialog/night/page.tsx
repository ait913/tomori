"use client";

import { useState } from "react";

import { DialogExperience } from "@/components/DialogExperience";
import { PageFrame } from "@/components/PageFrame";
import { apiClient } from "@/lib/api-client";
import { combineDateAndTime, tokyoToday } from "@/lib/date";

export default function NightDialogPage() {
  const [date] = useState(tokyoToday());
  const [bedtimeAt, setBedtimeAt] = useState("23:45");
  const [quality, setQuality] = useState("3");

  return (
    <PageFrame title="夜の対話">
      <DialogExperience
        afterCloseText="設計書上は「保存」「編集」導線がありますが、backend には summary 編集 API がないため表示のみです。"
        description="就寝前に 3-5 ターンで振り返ります。最後に summary が保存されます。"
        mode="evening"
        onBeforeStart={async () => {
          await apiClient.post("/api/sleep", {
            date,
            bedtime_at: combineDateAndTime(date, bedtimeAt),
            quality: Number(quality)
          });
        }}
        startFields={
          <div className="space-y-4">
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
              <span className="mb-2 block font-medium">今日の睡眠見込み</span>
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
        startLabel="振り返る"
        title="就寝時刻はだいたい?"
      />
    </PageFrame>
  );
}

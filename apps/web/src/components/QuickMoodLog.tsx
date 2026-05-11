"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MOOD_TAGS, type MoodCreateInput, type MoodTag } from "@tomori/shared";

import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/providers";
import { ja } from "@/i18n/ja";

type QuickMoodLogProps = {
  compact?: boolean;
};

export function QuickMoodLog({ compact = false }: QuickMoodLogProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [score, setScore] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [tags, setTags] = useState<MoodTag[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [valence, setValence] = useState("0");
  const [arousal, setArousal] = useState("0");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleTag(tag: MoodTag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : current.length < 8 ? [...current, tag] : current
    );
  }

  async function onSave() {
    if (!score) {
      return;
    }

    const payload: MoodCreateInput = {
      score,
      tags,
      source: "manual"
    };

    if (detailOpen) {
      payload.valence = Number(valence);
      payload.arousal = Number(arousal);
      if (note.trim().length > 0) {
        payload.note = note.trim();
      }
    }

    setSaving(true);
    try {
      await apiClient.post("/api/mood", payload);
      showToast("保存しました");
      router.push("/home");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
      <div>
        <h2 className="text-xl font-semibold">気分は今どう?</h2>
        <p className="mt-1 text-sm text-tomori-muted-light dark:text-tomori-muted-dark">
          まずはざっくり。必要なら detail を開いて補足できます。
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            key={item}
            className={[
              "rounded-2xl border px-3 py-4 text-lg font-semibold transition",
              score === item
                ? "border-tomori-accent-500 bg-tomori-accent-500 text-white"
                : "border-tomori-accent-100 bg-tomori-accent-50 text-tomori-text-light dark:border-tomori-accent-700/50 dark:bg-[rgba(240,160,48,0.1)] dark:text-tomori-text-dark"
            ].join(" ")}
            onClick={() => setScore(item as 1 | 2 | 3 | 4 | 5)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div>
        <div className="mb-3 text-sm font-medium text-tomori-muted-light dark:text-tomori-muted-dark">タグ</div>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map((tag) => (
            <button
              key={tag}
              className={[
                "rounded-full border px-3 py-2 text-xs transition",
                tags.includes(tag)
                  ? "border-tomori-accent-500 bg-tomori-accent-500 text-white"
                  : "border-tomori-accent-100 bg-white text-tomori-muted-light dark:border-tomori-accent-700/50 dark:bg-transparent dark:text-tomori-muted-dark"
              ].join(" ")}
              onClick={() => toggleTag(tag)}
              type="button"
            >
              {ja.moodTagsLabel[tag]}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-tomori-accent-100 p-4 dark:border-tomori-accent-700/50">
        <button className="text-sm font-semibold" onClick={() => setDetailOpen((value) => !value)} type="button">
          {detailOpen ? "▼ Detail を閉じる" : "▶ Detail"}
        </button>
        {detailOpen ? (
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="mb-2 block font-medium">valence</span>
              <input
                className="w-full accent-tomori-accent-500"
                max="1"
                min="-1"
                onChange={(event) => setValence(event.target.value)}
                step="0.1"
                type="range"
                value={valence}
              />
              <span className="text-xs text-tomori-muted-light dark:text-tomori-muted-dark">{valence}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-2 block font-medium">arousal</span>
              <input
                className="w-full accent-tomori-accent-500"
                max="1"
                min="-1"
                onChange={(event) => setArousal(event.target.value)}
                step="0.1"
                type="range"
                value={arousal}
              />
              <span className="text-xs text-tomori-muted-light dark:text-tomori-muted-dark">{arousal}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-2 block font-medium">自由記述</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                value={note}
              />
            </label>
          </div>
        ) : null}
      </div>
      <button
        className="w-full rounded-full bg-tomori-accent-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        disabled={!score || saving}
        onClick={() => void onSave()}
        type="button"
      >
        {saving ? "保存中…" : compact ? "記録する" : "保存"}
      </button>
    </section>
  );
}

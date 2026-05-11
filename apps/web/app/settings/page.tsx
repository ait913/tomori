"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ExportPayload } from "@tomori/shared";

import { PageFrame } from "@/components/PageFrame";
import { useToast } from "@/components/providers";
import { ja } from "@/i18n/ja";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store/app";

const THEMES = ["light", "dark", "system"] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const reset = useAppStore((state) => state.reset);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function downloadExport() {
    setExporting(true);
    try {
      const payload = await apiClient.get<ExportPayload>("/api/export");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "tomori-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      showToast("エクスポートを作成しました");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await apiClient.post("/api/account/delete", { confirm });
      reset();
      router.replace("/login");
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await apiClient.post("/api/auth/logout");
      reset();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <PageFrame title="settings">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
          <h2 className="text-lg font-semibold">テーマ</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {THEMES.map((item) => (
              <button
                key={item}
                className={[
                  "rounded-full px-4 py-3 text-sm font-semibold transition",
                  theme === item
                    ? "bg-tomori-accent-500 text-white"
                    : "border border-tomori-accent-100 dark:border-tomori-accent-700/50"
                ].join(" ")}
                onClick={() => setTheme(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
          <h2 className="text-lg font-semibold">利用説明</h2>
          <div className="mt-4 space-y-2 text-sm leading-6 text-tomori-muted-light dark:text-tomori-muted-dark">
            {ja.disclosure.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
          <h2 className="text-lg font-semibold">データ</h2>
          <div className="mt-4 space-y-3">
            <button
              className="w-full rounded-full bg-tomori-accent-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              disabled={exporting}
              onClick={() => void downloadExport()}
              type="button"
            >
              {exporting ? "作成中…" : "データをエクスポート"}
            </button>
            <button
              className="w-full rounded-full border border-tomori-accent-100 px-4 py-3 text-sm font-semibold dark:border-tomori-accent-700/50"
              disabled={loggingOut}
              onClick={() => void logout()}
              type="button"
            >
              {loggingOut ? "処理中…" : "ログアウト"}
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-tomori-danger-500/30 bg-white/80 p-5 shadow-glow backdrop-blur dark:bg-[rgba(42,37,33,0.82)]">
          <h2 className="text-lg font-semibold text-tomori-danger-500">全データ削除</h2>
          <p className="mt-2 text-sm leading-6 text-tomori-muted-light dark:text-tomori-muted-dark">
            `DELETE` と入力すると削除を実行します。
          </p>
          <input
            className="mt-4 w-full rounded-2xl border border-tomori-danger-500/30 bg-transparent px-4 py-3 outline-none"
            onChange={(event) => setConfirm(event.target.value)}
            value={confirm}
          />
          <button
            className="mt-4 w-full rounded-full bg-tomori-danger-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            disabled={confirm !== "DELETE" || deleting}
            onClick={() => void deleteAccount()}
            type="button"
          >
            {deleting ? "削除中…" : "全データ削除"}
          </button>
        </section>
      </div>
    </PageFrame>
  );
}

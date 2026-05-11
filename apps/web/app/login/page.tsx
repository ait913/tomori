"use client";

import { useState } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api-client";

export default function LoginPage() {
  const [email, setEmail] = useState("touri1705@outlook.com");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post<{ sent: boolean }>("/api/auth/magic/request", { email });
      setSubmitted(true);
    } catch (caught) {
      if (caught instanceof Error) {
        setError(caught.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,227,176,0.55),transparent_35%),linear-gradient(180deg,#FFF8EE_0%,#FFF1DE_100%)] px-4 py-8 text-tomori-text-light dark:bg-[radial-gradient(circle_at_top,rgba(240,160,48,0.18),transparent_30%),linear-gradient(180deg,#1B1814_0%,#191612_100%)] dark:text-tomori-text-dark">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
          <div className="text-xs uppercase tracking-[0.24em] text-tomori-muted-light dark:text-tomori-muted-dark">tomori</div>
          <h1 className="mt-3 text-3xl font-semibold">ログイン</h1>
          <p className="mt-3 text-sm leading-6 text-tomori-muted-light dark:text-tomori-muted-dark">
            magic link を送ります。許可済みメール以外は見た目だけ同じで何も起きません。
          </p>
          <label className="mt-6 block text-sm">
            <span className="mb-2 block font-medium">email</span>
            <input
              className="w-full rounded-2xl border border-tomori-accent-100 bg-transparent px-4 py-3 outline-none dark:border-tomori-accent-700/50"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <button
            className="mt-5 w-full rounded-full bg-tomori-accent-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            disabled={loading}
            onClick={() => void onSubmit()}
            type="button"
          >
            {loading ? "送信中…" : "magic link を送る"}
          </button>
          {submitted ? <p className="mt-4 text-sm text-tomori-muted-light dark:text-tomori-muted-dark">メールを確認してください。</p> : null}
          {error ? <p className="mt-4 text-sm text-tomori-danger-500">{error}</p> : null}
          <Link className="mt-6 inline-block text-sm text-tomori-muted-light underline dark:text-tomori-muted-dark" href="/onboarding">
            このアプリについて
          </Link>
        </div>
      </div>
    </div>
  );
}

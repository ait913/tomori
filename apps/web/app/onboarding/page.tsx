import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,227,176,0.55),transparent_35%),linear-gradient(180deg,#FFF8EE_0%,#FFF1DE_100%)] px-4 py-8 text-tomori-text-light dark:bg-[radial-gradient(circle_at_top,rgba(240,160,48,0.18),transparent_30%),linear-gradient(180deg,#1B1814_0%,#191612_100%)] dark:text-tomori-text-dark">
      <div className="mx-auto max-w-2xl space-y-4">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]">
          <div className="text-xs uppercase tracking-[0.24em] text-tomori-muted-light dark:text-tomori-muted-dark">tomori</div>
          <h1 className="mt-3 text-3xl font-semibold">Web 完結の生活リズム MVP</h1>
          <p className="mt-4 text-sm leading-7 text-tomori-muted-light dark:text-tomori-muted-dark">
            設計書には onboarding の具体仕様がないため、このページは固定案内のみです。朝と夜の対話、気分ログ、睡眠報告、履歴確認に絞っています。
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["朝", "起床時刻と短い対話で一日の入り口を整える。"],
            ["夜", "5 ターン上限で振り返り、summary を保存する。"],
            ["履歴", "その日の mood と sleep と summary をまとめて見る。"]
          ].map(([title, body]) => (
            <div
              className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.82)]"
              key={title}
            >
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-tomori-muted-light dark:text-tomori-muted-dark">{body}</p>
            </div>
          ))}
        </section>
        <div className="flex gap-3">
          <Link className="rounded-full bg-tomori-accent-500 px-5 py-3 text-sm font-semibold text-white" href="/login">
            ログインへ
          </Link>
          <Link className="rounded-full border border-tomori-accent-100 px-5 py-3 text-sm font-semibold dark:border-tomori-accent-700/50" href="/home">
            ホームを見る
          </Link>
        </div>
      </div>
    </div>
  );
}

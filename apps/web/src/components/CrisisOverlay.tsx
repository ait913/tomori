"use client";

import { useAppStore } from "@/store/app";

export function CrisisOverlay() {
  const crisis = useAppStore((state) => state.crisis);
  const close = useAppStore((state) => state.closeCrisisCard);

  if (!crisis.open || !crisis.card) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(27,24,20,0.72)] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-tomori-danger-500/30 bg-tomori-surface-light p-6 text-tomori-text-light shadow-glow dark:bg-tomori-surface-dark dark:text-tomori-text-dark">
        <div className="mb-4 inline-flex rounded-full bg-tomori-danger-500/10 px-3 py-1 text-xs font-semibold text-tomori-danger-500">
          safety
        </div>
        <h2 className="text-2xl font-semibold">{crisis.card.title}</h2>
        <p className="mt-3 text-sm leading-6 text-tomori-muted-light dark:text-tomori-muted-dark">{crisis.card.message}</p>
        <div className="mt-5 space-y-3">
          {crisis.card.hotlines.map((hotline) => (
            <a
              key={`${hotline.label}-${hotline.tel}`}
              href={`tel:${hotline.tel}`}
              className="flex items-center justify-between rounded-2xl border border-tomori-accent-100 bg-tomori-accent-50 px-4 py-3 text-sm font-medium dark:border-tomori-accent-700/50 dark:bg-[rgba(240,160,48,0.12)]"
            >
              <span>{hotline.label}</span>
              <span>{hotline.tel}</span>
            </a>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          {crisis.card.hotlines[0] ? (
            <a
              href={`tel:${crisis.card.hotlines[0].tel}`}
              className="flex-1 rounded-full bg-tomori-danger-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              電話する
            </a>
          ) : null}
          <button
            className="flex-1 rounded-full border border-tomori-accent-100 px-4 py-3 text-sm font-semibold dark:border-tomori-accent-700/50"
            onClick={close}
            type="button"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

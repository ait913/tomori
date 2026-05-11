"use client";

import { formatDateTime } from "@/lib/date";

type ChatTurnProps = {
  role: "user" | "assistant";
  text: string;
  ts: string;
};

export function ChatTurn({ role, text, ts }: ChatTurnProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={[
          "max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm",
          isAssistant
            ? "bg-white text-tomori-text-light dark:bg-[rgba(255,243,220,0.08)] dark:text-tomori-text-dark"
            : "bg-tomori-accent-500 text-white"
        ].join(" ")}
      >
        <div className="whitespace-pre-wrap text-sm leading-6">{text}</div>
        <div className={`mt-2 text-[11px] ${isAssistant ? "text-tomori-muted-light dark:text-tomori-muted-dark" : "text-white/70"}`}>
          {formatDateTime(ts)}
        </div>
      </div>
    </div>
  );
}

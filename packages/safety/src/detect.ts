import { ESCALATE_MODEL, runLLM } from "@tomori/llm";

import { CRISIS_PATTERNS_JA } from "./patterns.js";

export type CrisisDetection = {
  hit: boolean;
  by: "regex" | "classifier" | "both" | "none";
  matched?: string[];
};

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

export function detectCrisisRegex(text: string): CrisisDetection {
  const normalized = normalize(text);
  const matched = CRISIS_PATTERNS_JA.filter((pattern) => pattern.regex.test(normalized)).map((pattern) => pattern.id);

  if (!matched.length) {
    return { hit: false, by: "none", matched: [] };
  }

  return { hit: true, by: "regex", matched };
}

export async function detectCrisisClassifier(text: string): Promise<CrisisDetection> {
  const result = await runLLM({
    model: ESCALATE_MODEL,
    systemPrompt:
      "次の日本語メッセージが自傷・自死・他害・虐待被害の緊急兆候を含むなら YES、含まないなら NO だけを返してください。",
    messages: [{ role: "user", content: text }],
    maxTokens: 8
  });

  return result.text.trim().toUpperCase() === "YES"
    ? { hit: true, by: "classifier" }
    : { hit: false, by: "none" };
}

export async function detectCrisis(text: string): Promise<CrisisDetection> {
  const regex = detectCrisisRegex(text);
  if (regex.hit) {
    return regex;
  }
  return detectCrisisClassifier(text);
}

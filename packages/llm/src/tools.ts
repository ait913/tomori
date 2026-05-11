import type { Tool } from "@anthropic-ai/sdk/resources/messages";

import type { DialogSummary } from "@tomori/shared";

export type ToolDef = {
  name: string;
  description: string;
  input_schema: Tool["input_schema"];
  strict: true;
};

export const TOOL_SAVE_SUMMARY: ToolDef = {
  name: "save_summary",
  description: "対話セッションの終了時に呼び出し、構造化サマリーを保存する",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "sentiment_score",
      "top_emotions",
      "key_events",
      "insights",
      "unresolved_concerns",
      "action_item_tomorrow"
    ],
    properties: {
      sentiment_score: { type: "number", minimum: -1, maximum: 1 },
      top_emotions: { type: "array", items: { type: "string" }, maxItems: 5 },
      key_events: { type: "array", items: { type: "string" }, maxItems: 5 },
      insights: { type: "string", maxLength: 120 },
      unresolved_concerns: { type: "string", maxLength: 80 },
      action_item_tomorrow: { type: "string", maxLength: 80 }
    }
  },
  strict: true
};

export type SummaryToolInput = Omit<
  DialogSummary,
  "date" | "mode" | "turn_count" | "closed_by"
>;

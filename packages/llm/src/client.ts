import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool, ToolChoice } from "@anthropic-ai/sdk/resources/messages";

import { AppError } from "@tomori/shared";

import type { ToolDef } from "./tools.js";

export type LLMModel = "claude-haiku-4-5-20251001" | "claude-sonnet-4-6";

export const DEFAULT_MODEL: LLMModel = "claude-haiku-4-5-20251001";
export const ESCALATE_MODEL: LLMModel = "claude-sonnet-4-6";

export type LLMRunOptions = {
  model?: LLMModel;
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  toolDefinitions?: ToolDef[];
  toolChoice?: ToolChoice;
  signal?: AbortSignal;
};

export type LLMRunResult = {
  text: string;
  stopReason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
  usage: { input: number; output: number };
  model: LLMModel;
  toolUse?: {
    name: string;
    input: Record<string, unknown>;
  };
};

function mapTools(toolDefinitions?: ToolDef[]): Tool[] | undefined {
  if (!toolDefinitions?.length) {
    return undefined;
  }

  return toolDefinitions.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
    cache_control: undefined
  }));
}

export function createLLMRunner(client: Anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 })) {
  return async function runLLM(opts: LLMRunOptions): Promise<LLMRunResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    const signal = opts.signal
      ? AbortSignal.any([controller.signal, opts.signal])
      : controller.signal;

    try {
      const response = await client.messages.create(
        {
          model: opts.model ?? DEFAULT_MODEL,
          system: opts.systemPrompt,
          max_tokens: opts.maxTokens ?? 512,
          messages: opts.messages as MessageParam[],
          tools: mapTools(opts.toolDefinitions),
          tool_choice: opts.toolChoice
        },
        { signal }
      );

      let text = "";
      let toolUse: LLMRunResult["toolUse"];

      for (const block of response.content) {
        if (block.type === "text") {
          text += block.text;
        }
        if (block.type === "tool_use") {
          toolUse = {
            name: block.name,
            input: block.input as Record<string, unknown>
          };
        }
      }

      return {
        text: text.trim(),
        stopReason: response.stop_reason ?? "end_turn",
        usage: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens
        },
        model: response.model as LLMModel,
        toolUse
      };
    } catch (error) {
      if (controller.signal.aborted) {
        throw new AppError(504, "LLM_TIMEOUT", "Anthropic request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}

export const runLLM = createLLMRunner();

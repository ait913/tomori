import { z } from "zod";

import { MOOD_TAGS } from "./tags.js";

export const MoodCreateInputSchema = z.object({
  ts: z.string().datetime().optional(),
  score: z.number().int().min(1).max(5),
  valence: z.number().min(-1).max(1).optional(),
  arousal: z.number().min(-1).max(1).optional(),
  tags: z.array(z.enum(MOOD_TAGS)).max(8).default([]),
  note: z.string().max(2000).optional(),
  source: z.enum(["manual", "evening_dialog", "morning_dialog"]).default("manual")
});

export const SleepReportInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    bedtime_at: z.string().datetime().optional(),
    wake_at: z.string().datetime().optional(),
    quality: z.number().int().min(1).max(5).optional()
  })
  .refine((value) => value.bedtime_at || value.wake_at || value.quality, {
    message: "at least one of bedtime_at/wake_at/quality required"
  });

export const DialogStartInputSchema = z.object({
  mode: z.enum(["morning", "evening", "talk"])
});

export const DialogTurnInputSchema = z.object({
  text: z.string().min(1).max(2000)
});

export const AccountDeleteInputSchema = z.object({
  confirm: z.literal("DELETE")
});

export const MagicLinkRequestSchema = z.object({
  email: z.string().email()
});

export const HistoryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const MoodRangeQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })
  .refine((value) => value.from <= value.to, {
    message: "from must be before or equal to to"
  });

export const SleepDateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export type MoodCreateInput = z.infer<typeof MoodCreateInputSchema>;
export type SleepReportInput = z.infer<typeof SleepReportInputSchema>;
export type DialogStartInput = z.infer<typeof DialogStartInputSchema>;
export type DialogTurnInput = z.infer<typeof DialogTurnInputSchema>;
export type AccountDeleteInput = z.infer<typeof AccountDeleteInputSchema>;

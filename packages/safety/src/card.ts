import { z } from "zod";

import type { CrisisCard } from "@tomori/shared";

const CrisisCardSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  hotlines: z.array(
    z.object({
      label: z.string().min(1),
      tel: z.string().min(1)
    })
  )
});

export function loadCrisisCardFromEnv(): CrisisCard {
  const raw = process.env.TOMORI_CRISIS_HOTLINES_JSON;
  if (!raw) {
    throw new Error("TOMORI_CRISIS_HOTLINES_JSON is required");
  }

  return CrisisCardSchema.parse(JSON.parse(raw));
}

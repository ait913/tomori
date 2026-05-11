export const MOOD_TAGS = [
  "work",
  "study",
  "social",
  "isolation",
  "exercise",
  "walk",
  "sleep_well",
  "sleep_poor",
  "food",
  "caffeine",
  "alcohol",
  "creative",
  "reading",
  "gaming",
  "family",
  "partner",
  "friend",
  "anxiety",
  "focus_high",
  "fatigue",
  "morning_dialog",
  "evening_dialog"
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

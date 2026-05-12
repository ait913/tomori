import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  TOMORI_KEK_PROVIDER: z.enum(["env", "kms"]).default("env"),
  TOMORI_SESSION_HMAC_SECRET: z.string().min(1),
  TOMORI_ALLOWLIST: z.string().min(1),
  TOMORI_PUBLIC_BASE_URL: z.string().url(),
  TOMORI_API_BASE_URL: z.string().url(),
  TOMORI_MAIL_FROM: z.string().min(1),
  TOMORI_CORS_ORIGIN: z.string().url(),
  TOMORI_CRISIS_HOTLINES_JSON: z.string().min(1),
  NODE_ENV: z.string().default("development")
});

const parsed = EnvSchema.parse(process.env);

export const appConfig = {
  ...parsed,
  allowlist: parsed.TOMORI_ALLOWLIST.split(",").map((value) => value.trim().toLowerCase())
};

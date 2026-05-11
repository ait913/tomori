import type { Context } from "hono";

import { ok } from "../lib/http.js";

export async function healthHandler(c: Context): Promise<Response> {
  await c.get("pool").query("SELECT 1");
  return c.json(ok({ status: "ok" }).body);
}

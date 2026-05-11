import { serve } from "@hono/node-server";

import { createApp } from "./server.js";

const port = Number(process.env.PORT ?? 3001);

serve({
  fetch: createApp().fetch,
  port
});

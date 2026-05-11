type LogPayload = Record<string, unknown>;

export function log(level: "info" | "error", payload: LogPayload): void {
  console[level === "error" ? "error" : "log"](
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      ...payload
    })
  );
}

const TOKYO_TIME_ZONE = "Asia/Tokyo";

export function toTokyoDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

export function toTokyoTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TOKYO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return formatter.format(date);
}

export function toIso(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? new Date(value).toISOString() : value.toISOString();
}

export function nowPlusSeconds(seconds: number): Date {
  return new Date(Date.now() + seconds * 1_000);
}

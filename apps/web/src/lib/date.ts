"use client";

const TOKYO_LOCALE = "ja-JP";
const TOKYO_TZ = "Asia/Tokyo";

export function tokyoToday(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(TOKYO_LOCALE, {
    timeZone: TOKYO_TZ,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatDateOnly(isoDate: string): string {
  return new Intl.DateTimeFormat(TOKYO_LOCALE, {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).format(new Date(`${isoDate}T00:00:00+09:00`));
}

export function combineDateAndTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

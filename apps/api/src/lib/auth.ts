import { createHmac, randomBytes } from "node:crypto";

import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { Context } from "hono";

import { AppError } from "@tomori/shared";

import { appConfig } from "./config.js";
import { nowPlusSeconds } from "./time.js";
import type { SessionUser } from "../types.js";

export const SESSION_COOKIE = "tomori_sid";
export const CSRF_HEADER = "x-tomori-csrf";

function hmac(data: string): Buffer {
  return createHmac("sha256", Buffer.from(appConfig.TOMORI_SESSION_HMAC_SECRET, "base64"))
    .update(data)
    .digest();
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): Buffer {
  return hmac(token);
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 2_592_000,
    path: "/",
    ...(appConfig.TOMORI_COOKIE_DOMAIN ? { domain: appConfig.TOMORI_COOKIE_DOMAIN } : {})
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, {
    path: "/",
    ...(appConfig.TOMORI_COOKIE_DOMAIN ? { domain: appConfig.TOMORI_COOKIE_DOMAIN } : {})
  });
}

export function readSessionCookie(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE);
}

export async function requireSessionUser(c: Context): Promise<SessionUser> {
  const sessionUser = c.get("sessionUser") as SessionUser | null;
  if (!sessionUser) {
    throw new AppError(401, "UNAUTHORIZED", "Session is required");
  }
  return sessionUser;
}

export function createMagicExpiry(): Date {
  return nowPlusSeconds(30 * 60);
}

export function createSessionExpiry(): Date {
  return nowPlusSeconds(30 * 24 * 60 * 60);
}

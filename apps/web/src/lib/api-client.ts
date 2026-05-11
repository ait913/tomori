"use client";

import type { ApiFailure, ApiResponse } from "@tomori/shared";

const CSRF_HEADER = "X-Tomori-Csrf";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly payload: ApiFailure["error"] | null;

  public constructor(message: string, status: number, payload: ApiFailure["error"] | null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

function getApiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured && configured.length > 0) {
    return configured;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

function toAbsoluteUrl(path: string): string {
  return new URL(path, getApiOrigin()).toString();
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(toAbsoluteUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [CSRF_HEADER]: "1",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.ok) {
    throw new ApiClientError(
      payload && !payload.ok ? payload.error.message : "Request failed",
      response.status,
      payload && !payload.ok ? payload.error : null
    );
  }

  return payload.data;
}

export const apiClient = {
  get<T>(path: string) {
    return apiRequest<T>(path, { method: "GET" });
  },
  post<T>(path: string, body?: unknown) {
    return apiRequest<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }
};

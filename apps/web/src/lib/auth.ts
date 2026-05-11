"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiClient } from "./api-client";
import { useAppStore, type SessionUser } from "../store/app";

const PUBLIC_PATHS = new Set(["/login", "/onboarding"]);

export function useSession() {
  const sessionUser = useAppStore((state) => state.sessionUser);
  const setSessionUser = useAppStore((state) => state.setSessionUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const me = await apiClient.get<SessionUser>("/api/auth/me");
        if (!cancelled) {
          setSessionUser(me);
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [setSessionUser]);

  return { sessionUser, loading };
}

export function useSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionUser, loading } = useSession();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!sessionUser && !PUBLIC_PATHS.has(pathname)) {
      router.replace("/login");
    }
    if (sessionUser && pathname === "/login") {
      router.replace("/home");
    }
  }, [loading, pathname, router, sessionUser]);

  return { sessionUser, loading, isPublic: PUBLIC_PATHS.has(pathname) };
}

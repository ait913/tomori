"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useSessionGuard } from "@/lib/auth";
import { useAppStore, type ThemeMode } from "@/store/app";

import { CrisisOverlay } from "./CrisisOverlay";

type ToastState = {
  message: string;
};

type ToastContextValue = {
  toast: ToastState | null;
  showToast: (message: string) => void;
  clearToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "light" || theme === "dark") {
    return theme;
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function Toaster() {
  const context = useContext(ToastContext);

  if (!context?.toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
      <div
        className="rounded-full bg-tomori-text-light px-4 py-2 text-sm font-medium text-tomori-bg-light shadow-glow dark:bg-tomori-accent-100 dark:text-tomori-bg-dark"
        role="status"
      >
        {context.toast.message}
      </div>
    </div>
  );
}

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { loading, isPublic } = useSessionGuard();

  if (loading && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tomori-bg-light text-tomori-muted-light dark:bg-tomori-bg-dark dark:text-tomori-muted-dark">
        読み込み中…
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("tomori-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
  }, [setTheme]);

  useEffect(() => {
    const nextTheme = resolveTheme(theme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("tomori-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider
      value={{
        toast,
        showToast: (message) => setToast({ message }),
        clearToast: () => setToast(null)
      }}
    >
      <div className="min-h-screen">
        <SessionGuard>{children}</SessionGuard>
        <CrisisOverlay />
        <Toaster />
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within Providers");
  }
  return context;
}

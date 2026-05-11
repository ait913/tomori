"use client";

import { create } from "zustand";

import type { CrisisCard, DialogTurnView } from "@tomori/shared";

export type SessionUser = {
  id: string;
  email: string;
};

export type DialogMode = "morning" | "evening" | "talk";
export type DialogStatus = "idle" | "streaming" | "closing" | "closed";
export type OrbState = "idle" | "morning" | "evening" | "talking" | "crisis";
export type ThemeMode = "light" | "dark" | "system";

type DialogSessionState = {
  id: string;
  mode: DialogMode;
  turns: DialogTurnView[];
  status: DialogStatus;
};

type AppState = {
  sessionUser: SessionUser | null;
  dialogSession: DialogSessionState | null;
  crisis: {
    open: boolean;
    card: CrisisCard | null;
  };
  theme: ThemeMode;
  setSessionUser: (user: SessionUser | null) => void;
  setDialogSession: (session: DialogSessionState | null) => void;
  appendTurn: (turn: DialogTurnView) => void;
  setDialogStatus: (status: DialogStatus) => void;
  openCrisisCard: (card: CrisisCard) => void;
  closeCrisisCard: () => void;
  setTheme: (theme: ThemeMode) => void;
  reset: () => void;
};

const DEFAULT_THEME: ThemeMode = "system";

export const useAppStore = create<AppState>((set) => ({
  sessionUser: null,
  dialogSession: null,
  crisis: {
    open: false,
    card: null
  },
  theme: DEFAULT_THEME,
  setSessionUser: (sessionUser) => set({ sessionUser }),
  setDialogSession: (dialogSession) => set({ dialogSession }),
  appendTurn: (turn) =>
    set((state) => ({
      dialogSession: state.dialogSession
        ? {
            ...state.dialogSession,
            turns: [...state.dialogSession.turns, turn]
          }
        : state.dialogSession
    })),
  setDialogStatus: (status) =>
    set((state) => ({
      dialogSession: state.dialogSession ? { ...state.dialogSession, status } : state.dialogSession
    })),
  openCrisisCard: (card) =>
    set({
      crisis: {
        open: true,
        card
      }
    }),
  closeCrisisCard: () =>
    set({
      crisis: {
        open: false,
        card: null
      }
    }),
  setTheme: (theme) => set({ theme }),
  reset: () =>
    set({
      sessionUser: null,
      dialogSession: null,
      crisis: {
        open: false,
        card: null
      },
      theme: DEFAULT_THEME
    })
}));

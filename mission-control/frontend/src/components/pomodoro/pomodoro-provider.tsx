"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { PomodoroModal } from "./pomodoro-modal";

interface PomodoroCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<PomodoroCtx | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <Ctx.Provider value={{ isOpen, open, close }}>
      {children}
      {isOpen && <PomodoroModal onExit={close} />}
    </Ctx.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePomodoro must be used inside PomodoroProvider");
  return ctx;
}

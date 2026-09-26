"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { user } from "@/lib/mock-data";
import { usePomodoro } from "@/components/pomodoro/pomodoro-provider";

function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}

function useNow() {
  const [now, setNow] = useState(() => formatTime(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  const time = useNow();
  const { open } = usePomodoro();

  return (
    <header className="flex items-center justify-between gap-6 px-8 py-6 border-b border-border/60 bg-bg/40 backdrop-blur-sm sticky top-0 z-[5]">
      <div>
        <Eyebrow>{subtitle}</Eyebrow>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={open} className="btn btn-primary hidden md:inline-flex">
          <Icon name="play" size={14}/> Iniciar foco
        </button>
        <div className="hidden md:flex items-center gap-2 panel-flat px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
          <span className="text-xs font-mono tabular text-mute">MC-TIME</span>
          <span className="text-xs font-mono tabular text-ink">{time}</span>
        </div>
        <div className="flex items-center gap-2.5 panel-flat pl-1 pr-3 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[12px] font-bold">
            {user.avatar}
          </div>
          <div className="text-sm leading-tight">
            <div className="font-semibold">{user.name}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute">Cmdr · trainee</div>
          </div>
        </div>
      </div>
    </header>
  );
}

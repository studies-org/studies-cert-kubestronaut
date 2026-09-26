"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Ring } from "@/components/ui/primitives";
import { pomodoroModes, streak, type PomodoroModeId } from "@/lib/mock-data";

type Phase = "focus" | "break";

export function PomodoroModal({ onExit }: { onExit: () => void }) {
  const [modeId, setModeId] = useState<PomodoroModeId>("long");
  const mode = pomodoroModes.find((m) => m.id === modeId)!;
  const [remaining, setRemaining] = useState(mode.focus * 60);
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState<Phase>("focus");

  useEffect(() => {
    setRemaining(mode.focus * 60);
    setPhase("focus");
    setRunning(true);
  }, [modeId, mode.focus]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining > 0) return;
    if (phase === "focus") { setPhase("break"); setRemaining(mode.break * 60); }
    else                   { setPhase("focus"); setRemaining(mode.focus * 60); }
  }, [remaining, phase, mode.break, mode.focus]);

  const denominator = (phase === "focus" ? mode.focus : mode.break) * 60;
  const value = 1 - remaining / denominator;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const isMad = modeId === "madrugadao";

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-hidden">
      <div className="stars">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            style={{
              top: `${(i * 17) % 100}%`,
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 7) * 0.4}s`,
              transform: `scale(${0.6 + ((i % 5) / 5)})`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#1a4ab5] flex items-center justify-center glow-primary">
            <Icon name="rocket" size={18} className="text-white" />
          </div>
          <div>
            <div className="eyebrow flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot"></span>
              {phase === "focus" ? "Sessão · em curso" : "Intervalo · respira"}
            </div>
            <div className="text-sm font-semibold mt-0.5">KCNA · Container Orchestration</div>
          </div>
        </div>
        <button onClick={onExit} className="btn btn-ghost">
          <Icon name="minimize-2" size={14}/> Sair do modo foco
        </button>
      </div>

      <div className="relative z-10 h-[calc(100vh-72px)] flex flex-col items-center justify-center px-8">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {pomodoroModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setModeId(m.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-all ${
                m.id === modeId
                  ? (m.id === "madrugadao" ? "bg-accent/15 text-accent border-accent/50 glow-accent" : "bg-primary/15 text-[#9DB7EF] border-primary/50")
                  : "bg-white/[0.03] text-mute border-border hover:text-ink"
              }`}
            >
              {m.id === "madrugadao" && <span className="mr-1">◐</span>}
              {m.label} · {m.focus}/{m.break}
            </button>
          ))}
        </div>

        <Ring value={value} size={420} stroke={14} paused={!running || phase === "break"}>
          <div className="text-center">
            <div className="eyebrow mb-3">
              {phase === "focus" ? `FOCO · ${mode.label}` : `INTERVALO · ${mode.break}min`}
            </div>
            <div
              className={`timer-num font-bold leading-none ${phase === "break" ? "text-glow-accent" : "text-glow-primary"}`}
              style={{ fontSize: 128 }}
            >
              {mm}<span className="opacity-40">:</span>{ss}
            </div>
            <div className="text-mute font-mono text-sm mt-4 tracking-wider">
              {running ? (phase === "break" ? "RESPIRA · 1 ciclo" : "MANTÉM A ÓRBITA") : "PAUSADO · O₂ ESTÁVEL"}
            </div>
          </div>
        </Ring>

        {isMad && (
          <div className="mt-6 panel px-5 py-3 flex items-center gap-5 brackets">
            <div className="flex items-center gap-2">
              <Icon name="moon" size={16} className="text-accent flame"/>
              <span className="eyebrow text-accent">MADRUGADÃO ATIVO</span>
            </div>
            <div className="text-sm">Bloco <span className="font-mono tabular text-ink font-semibold">3</span><span className="text-mute"> de 7</span></div>
            <div className="text-border">·</div>
            <div className="text-sm">Próxima refeição <span className="font-mono tabular text-warning">04:00</span></div>
            <div className="text-border">·</div>
            <div className="text-sm">Próximo banho <span className="font-mono tabular text-success">02:30</span></div>
          </div>
        )}

        <div className="mt-10 flex items-center gap-3">
          <button onClick={() => setRunning((r) => !r)} className={`btn ${running ? "btn-ghost" : "btn-primary"}`}>
            <Icon name={running ? "pause" : "play"} size={16}/> {running ? "Pausar" : "Retomar"}
          </button>
          <button onClick={() => setRemaining(denominator)} className="btn btn-ghost">
            <Icon name="rotate-ccw" size={14}/> Reiniciar
          </button>
          <button onClick={onExit} className="btn btn-danger">
            <Icon name="x" size={14}/> Cancelar sessão
          </button>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-4 w-full max-w-3xl">
          {[
            { k: "POMOS NA SESSÃO", v: phase === "focus" ? "2 / 4" : "3 / 4", icon: "list-checks" },
            { k: "TEMPO FOCO HOJE", v: "3h 12min", icon: "clock" },
            { k: "STREAK",          v: `${streak} dias`, icon: "flame" },
            { k: "MODO",            v: `${mode.focus} / ${mode.break} min`, icon: "timer" },
          ].map((r, i) => (
            <div key={i} className="panel-flat px-4 py-3 flex items-center gap-3">
              <Icon name={r.icon} size={16} className="text-mute"/>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-mute">{r.k}</div>
                <div className="font-mono tabular text-ink font-semibold">{r.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

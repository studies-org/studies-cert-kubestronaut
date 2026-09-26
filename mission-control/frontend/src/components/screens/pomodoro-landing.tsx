"use client";

import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Panel } from "@/components/ui/primitives";
import { usePomodoro } from "@/components/pomodoro/pomodoro-provider";
import { pomodoroModes } from "@/lib/mock-data";

const RECENT = [
  { t: "Hoje · 06:00",  cert: "KCNA", mode: "Long",    n: 3, dur: "2h 30min", focus: "Container Orchestration" },
  { t: "Ontem · 20:00", cert: "KCNA", mode: "Long",    n: 4, dur: "3h 20min", focus: "Componentes do K8s" },
  { t: "Ontem · 06:00", cert: "KCNA", mode: "Classic", n: 4, dur: "2h 40min", focus: "Pods e Workloads" },
  { t: "14/05 · 20:00", cert: "KCNA", mode: "Long",    n: 5, dur: "4h 10min", focus: "kubectl rollout" },
  { t: "13/05 · 06:00", cert: "KCNA", mode: "Classic", n: 3, dur: "2h 00min", focus: "Mapa CNCF" },
];

export function PomodoroLanding() {
  const { open } = usePomodoro();

  return (
    <>
      <TopBar title="Foco · Pomodoro" subtitle="MC · TIMER" />

      <div className="px-8 py-6 space-y-5">
        <Panel brackets className="p-6 relative overflow-hidden">
          <div className="absolute -right-32 -top-32 w-[500px] h-[500px] rounded-full bg-primary/15 blur-3xl pointer-events-none"/>
          <Eyebrow>Pré-flight</Eyebrow>
          <div className="flex items-end justify-between mt-2 gap-6 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Pronto para entrar em órbita?</h2>
              <p className="text-mute mt-1 max-w-lg">
                Escolha o modo de foco, confirme a cert ativa e mantenha a queima do booster.
                O ring na parte de cima da tela mostra o tempo restante.
              </p>
            </div>
            <button onClick={open} className="btn btn-primary">
              <Icon name="play" size={16}/> Iniciar foco agora
            </button>
          </div>
        </Panel>

        <div className="grid grid-cols-12 gap-4">
          {pomodoroModes.map((m) => {
            const isMad = m.id === "madrugadao";
            return (
              <button
                key={m.id}
                onClick={open}
                className={`col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 panel p-5 text-left clickcard ${isMad ? "glow-accent" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <Icon name={isMad ? "moon" : "timer"} size={18} className={isMad ? "text-accent" : "text-primary"}/>
                  {isMad && <Badge tone="accent">NOTURNO</Badge>}
                </div>
                <div className="text-lg font-bold tracking-tight mt-3">{m.label}</div>
                <div className="text-mute text-xs mt-0.5">{m.use}</div>
                <div className="mt-4 flex items-baseline gap-1.5 font-mono tabular">
                  <span className="text-3xl font-bold">{m.focus}</span>
                  <span className="text-mute text-sm">min foco</span>
                </div>
                <div className="text-mute text-xs font-mono mt-0.5">/ {m.break} min descanso</div>
              </button>
            );
          })}
        </div>

        <Panel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Bitácora · pomodoros recentes</Eyebrow>
              <h2 className="text-lg font-semibold tracking-tight mt-0.5">Últimas ignições</h2>
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {RECENT.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 py-3 items-center">
                <div className="col-span-3 text-sm font-mono tabular text-mute">{s.t}</div>
                <div className="col-span-1"><Badge tone="primary">{s.cert}</Badge></div>
                <div className="col-span-1"><Badge tone="mute">{s.mode}</Badge></div>
                <div className="col-span-1 text-xs font-mono text-mute flex items-center gap-1">
                  <Icon name="circle-dot" size={11}/> {s.n}
                </div>
                <div className="col-span-2 font-mono tabular text-sm">{s.dur}</div>
                <div className="col-span-4 text-sm text-ink/85 truncate">{s.focus}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

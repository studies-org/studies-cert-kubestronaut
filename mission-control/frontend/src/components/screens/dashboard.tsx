"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Heatmap, Panel, Progress } from "@/components/ui/primitives";
import { usePomodoro } from "@/components/pomodoro/pomodoro-provider";
import {
  certs, heatmap, lastSession, nextSession,
  pomodorosToday, pomodorosTodayTarget, streak, weeklyHours, weeklyTarget,
} from "@/lib/mock-data";

export function DashboardScreen() {
  const router = useRouter();
  const { open } = usePomodoro();
  const weekPct = (weeklyHours / weeklyTarget) * 100;
  const todayPomoPct = (pomodorosToday / pomodorosTodayTarget) * 100;

  return (
    <>
      <TopBar title="Painel principal" subtitle="MC · DASHBOARD" />

      <div className="px-8 py-6 space-y-6">
        <div className="grid grid-cols-12 gap-5">
          <Panel brackets className="col-span-12 lg:col-span-6 p-6 overflow-hidden relative">
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-mute pulse-dot" />
                <Eyebrow>Próxima sessão</Eyebrow>
              </div>
              {nextSession && <Badge tone="primary"><Icon name="calendar" size={11}/>{nextSession.when}</Badge>}
            </div>

            {nextSession ? (
              <>
                <div className="mt-5 flex items-end justify-between gap-6 relative">
                  <div>
                    <div className="text-mute font-mono text-xs mb-2 tracking-wider">CERT · FOCO</div>
                    <div className="text-4xl font-bold tracking-tight leading-none">{nextSession.cert}</div>
                    <div className="text-xl text-ink/85 mt-2">{nextSession.focus}</div>
                    <div className="flex items-center gap-2 mt-4 text-sm text-mute">
                      <Icon name="book-open" size={14}/>{nextSession.resource}
                      <span className="text-border">·</span>
                      <Icon name="hourglass" size={14}/>{nextSession.duration}
                    </div>
                  </div>
                  <button onClick={open} className="btn btn-primary">
                    <Icon name="play" size={16}/> Iniciar Pomodoro
                    <Icon name="arrow-right" size={14}/>
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 flex items-center justify-between gap-6 relative">
                <div>
                  <div className="text-2xl font-bold tracking-tight">Nenhuma sessão agendada</div>
                  <div className="text-mute text-sm mt-2 max-w-md">
                    Pronto pra primeira ignição? Clica em "Iniciar Pomodoro" pra começar uma sessão
                    livre, ou define uma rota fixa em <Link href="/cronograma" className="text-primary hover:underline">Cronograma</Link>.
                  </div>
                </div>
                <button onClick={open} className="btn btn-primary shrink-0">
                  <Icon name="play" size={16}/> Iniciar Pomodoro
                </button>
              </div>
            )}
          </Panel>

          <Panel className="col-span-12 sm:col-span-4 lg:col-span-2 p-5">
            <Eyebrow>Streak</Eyebrow>
            <div className="flex items-end gap-2 mt-3">
              <Icon name="flame" size={36} className="text-accent flame" />
              <div className="text-5xl font-bold leading-none tracking-tight text-glow-accent">{streak}</div>
            </div>
            <div className="text-xs text-mute mt-2">dias consecutivos</div>
            <div className="flex gap-1 mt-3">
              {Array.from({length: 7}).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 6 ? "bg-accent/70" : "bg-white/[0.08]"}`} />
              ))}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute mt-2">últimos 7 dias</div>
          </Panel>

          <Panel className="col-span-12 sm:col-span-4 lg:col-span-2 p-5">
            <Eyebrow>Esta semana</Eyebrow>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-5xl font-bold tabular tracking-tight">{weeklyHours}</span>
              <span className="text-lg text-mute">/{weeklyTarget}h</span>
            </div>
            <div className="mt-3"><Progress value={weeklyHours} max={weeklyTarget} thick /></div>
            <div className="text-[10px] font-mono uppercase tracking-wider mt-2 text-mute">
              faltam <span className="text-warning">{weeklyTarget - weeklyHours}h</span> · {Math.round(weekPct)}%
            </div>
          </Panel>

          <Panel className="col-span-12 sm:col-span-4 lg:col-span-2 p-5">
            <Eyebrow>Pomodoros hoje</Eyebrow>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-5xl font-bold tabular tracking-tight">{pomodorosToday}</span>
              <span className="text-lg text-mute">/{pomodorosTodayTarget}</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1">
              {Array.from({ length: pomodorosTodayTarget }).map((_, i) => {
                const done = i < pomodorosToday;
                return (
                  <div key={i} className={`h-3 rounded-sm flex items-center justify-center ${done ? "bg-accent/80" : "bg-white/[0.06]"}`}>
                    {done && <div className="w-1.5 h-1.5 rounded-full bg-bg" />}
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider mt-3 text-mute">
              {Math.round(todayPomoPct)}% do alvo
            </div>
          </Panel>
        </div>

        <Panel className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Eyebrow>Trajetória</Eyebrow>
              <h2 className="text-lg font-semibold tracking-tight mt-0.5">Roadmap das 5 certs · destino: Kubestronaut</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-mute">
              <Icon name="rocket" size={12}/> 1/5
              <div className="w-24 h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-primary" style={{width: "20%"}}/></div>
              5/5 <Icon name="trophy" size={12}/>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 relative">
            <div className="absolute top-[58px] left-[7%] right-[7%] h-px bg-gradient-to-r from-primary via-border to-border" />
            {certs.map((c, i) => {
              const isActive = c.status === "in_progress";
              const isDone = c.progress >= 100;
              return (
                <button
                  key={c.code}
                  onClick={() => router.push(`/certs/${c.code}`)}
                  className={`clickcard panel-flat p-4 text-left relative ${isActive ? "glow-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-mono ${
                      isActive ? "bg-primary text-white" : isDone ? "bg-success text-bg" : "bg-white/[0.06] text-mute"
                    }`}>
                      {i+1}
                    </div>
                    {isActive && <Badge tone="primary"><div className="w-1 h-1 rounded-full bg-primary pulse-dot"/>EM CURSO</Badge>}
                    {!isActive && c.status === "pending" && <Badge tone="mute">PENDING</Badge>}
                  </div>
                  <div className="mt-3 text-base font-bold tracking-tight">{c.code}</div>
                  <div className="text-xs text-mute mt-0.5 line-clamp-2 h-8">{c.name}</div>
                  <div className="mt-3">
                    <Progress value={c.progress} tone={isActive ? "primary" : "mute"} />
                    <div className="flex justify-between mt-1.5 text-[10px] font-mono text-mute">
                      <span>{c.progress}%</span>
                      <span>{c.hours}h</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="grid grid-cols-12 gap-5">
          <Panel className="col-span-12 lg:col-span-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Eyebrow>Telemetria · 12 semanas</Eyebrow>
                <h2 className="text-lg font-semibold tracking-tight mt-0.5">Atividade de estudo</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-mute">
                <span><span className="text-ink font-mono tabular">163</span> sessões</span>
                <span className="text-border">·</span>
                <span><span className="text-ink font-mono tabular">412h</span> totais</span>
                <span className="text-border">·</span>
                <span><span className="text-success font-mono tabular">+18%</span> vs trimestre anterior</span>
              </div>
            </div>
            <Heatmap data={heatmap} />
          </Panel>

          <Panel className="col-span-12 lg:col-span-4 p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>Última sessão</Eyebrow>
              <span className="text-xs text-mute">{lastSession?.date ?? "—"}</span>
            </div>
            {lastSession ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Icon name="check-check" size={22} className="text-primary"/>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{lastSession.duration}</div>
                    <div className="text-xs text-mute font-mono">{lastSession.pomodoros} pomodoros · modo {lastSession.mode}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-border/70 text-sm text-ink/85 leading-relaxed">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-mute mb-1">notas · {lastSession.cert}</div>
                  {lastSession.note}
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-white/[0.04] border border-border/70 flex items-center justify-center">
                  <Icon name="circle-dot" size={22} className="text-mute opacity-60"/>
                </div>
                <div className="text-sm text-mute mt-3">Nenhuma sessão registrada ainda</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-mute/70 mt-1">
                  comece um pomodoro pra abrir a bitácora
                </div>
              </div>
            )}
            <Link href="/stats" className="btn btn-ghost w-full mt-4 justify-center">
              <Icon name="file-text" size={14}/> Ver log completo
            </Link>
          </Panel>
        </div>
      </div>
    </>
  );
}

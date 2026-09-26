"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Panel } from "@/components/ui/primitives";
import {
  achievements, certTimeSplit, dailyHours, pomoHeatmap,
} from "@/lib/mock-data";

export function StatsScreen() {
  const totalHours = dailyHours.reduce((a, b) => a + b.hours, 0);
  const avg = totalHours / dailyHours.length;
  const peak = Math.max(...dailyHours.map((d) => d.hours));

  return (
    <>
      <TopBar title="Telemetria · histórico" subtitle="MC · STATS" />

      <div className="px-8 py-6 space-y-5">
        <div className="grid grid-cols-12 gap-4">
          <Kpi label="Horas (30d)"     value={totalHours.toFixed(0) + "h"} delta="+12%"  tone="primary" icon="clock"/>
          <Kpi label="Média / dia"     value={avg.toFixed(1) + "h"}        delta="+0.4h" tone="primary" icon="trending-up"/>
          <Kpi label="Pico"            value={peak.toFixed(1) + "h"}       delta="sex"   tone="accent"  icon="flame"/>
          <Kpi label="Pomodoros (30d)" value="284"                          delta="+47"   tone="primary" icon="timer"/>
          <Kpi label="Streak máx"      value="12 dias"                      delta="atual" tone="success" icon="zap"/>
          <Kpi label="Conclusão sem."  value="74%"                          delta="+8%"   tone="primary" icon="target"/>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <Panel className="col-span-12 lg:col-span-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Eyebrow>Telemetria · 30 dias</Eyebrow>
                <h2 className="text-lg font-semibold tracking-tight mt-0.5">Horas de estudo por dia</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-mute">
                <Badge tone="primary"><div className="w-1.5 h-1.5 rounded-sm bg-primary"/>Estudo</Badge>
                <Badge tone="accent"><div className="w-1.5 h-1.5 rounded-sm bg-accent"/>Madrugadão</Badge>
              </div>
            </div>
            <BarChart data={dailyHours} />
          </Panel>

          <Panel className="col-span-12 lg:col-span-4 p-6">
            <Eyebrow>Distribuição por cert</Eyebrow>
            <h2 className="text-lg font-semibold tracking-tight mt-0.5 mb-2">Tempo investido</h2>
            <Donut data={certTimeSplit} />
            <div className="mt-3 space-y-1.5">
              {certTimeSplit.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm" style={{ background: c.fill }}/>{c.name}</div>
                  <span className="font-mono tabular text-mute">{c.value}h</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Telemetria · cronotipo</Eyebrow>
              <h2 className="text-lg font-semibold tracking-tight mt-0.5">Pomodoros por hora × dia da semana</h2>
            </div>
            <div className="text-xs text-mute">picos: madrugadas e 06–09 / 20–00</div>
          </div>
          <HourDayHeatmap data={pomoHeatmap}/>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Insígnias · 3/8</Eyebrow>
              <h2 className="text-lg font-semibold tracking-tight mt-0.5">Conquistas</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((a, i) => (
              <div
                key={i}
                className={`panel-flat p-4 ${a.unlocked ? "" : "opacity-50"} ${a.unlocked && a.icon === "rocket" ? "glow-primary" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    a.unlocked ? "bg-primary/15 text-primary border border-primary/40" : "bg-white/[0.04] text-mute border border-border"
                  }`}>
                    <Icon name={a.icon} size={18}/>
                  </div>
                  {a.unlocked
                    ? <Badge tone="success">UNLOCKED</Badge>
                    : <Icon name="lock" size={12} className="text-mute"/>}
                </div>
                <div className="mt-3 font-semibold">{a.title}</div>
                <div className="text-xs text-mute mt-0.5">{a.desc}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-mute mt-2">{a.date}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Kpi({ label, value, delta, tone, icon }: { label: string; value: string; delta: string; tone: "primary" | "accent" | "success"; icon: string }) {
  const toneCls = { primary: "text-primary", accent: "text-accent", success: "text-success" }[tone];
  return (
    <Panel className="col-span-6 md:col-span-4 lg:col-span-2 p-4">
      <div className="flex items-center justify-between">
        <Icon name={icon} size={14} className={toneCls}/>
        <span className={`text-[10px] font-mono uppercase tracking-wider ${toneCls}`}>{delta}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular tracking-tight">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-mute mt-0.5">{label}</div>
    </Panel>
  );
}

function BarChart({ data }: { data: { day: string; hours: number }[] }) {
  const W = 760, H = 240, PAD_L = 32, PAD_B = 22, PAD_T = 12, PAD_R = 8;
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_B - PAD_T;
  const yTicks = [0, 4, 8, 12];
  const bw = innerW / data.length;
  const [hover, setHover] = useState<{ day: string; hours: number; x: number; y: number } | null>(null);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id="barPri" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5E92F5"/>
            <stop offset="100%" stopColor="#2A5DCE"/>
          </linearGradient>
          <linearGradient id="barAcc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF8551"/>
            <stop offset="100%" stopColor="#E54B14"/>
          </linearGradient>
        </defs>
        {yTicks.map((t) => {
          const y = PAD_T + innerH - (t / 14) * innerH;
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#232B45" strokeDasharray="3 4"/>
              <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#8892A6" fontFamily="JetBrains Mono">{t}h</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.hours / 14) * innerH;
          const x = PAD_L + i * bw + 2;
          const y = PAD_T + innerH - h;
          const isAcc = d.hours > 10;
          return (
            <g
              key={i}
              onMouseEnter={() => setHover({ ...d, x: x + (bw - 4) / 2, y })}
              onMouseLeave={() => setHover(null)}
            >
              <rect x={x} y={y} width={bw - 4} height={h} fill={isAcc ? "url(#barAcc)" : "url(#barPri)"} rx="2"/>
              {i % 4 === 0 && (
                <text x={x + (bw - 4) / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="#8892A6" fontFamily="JetBrains Mono">{d.day}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div
          className="absolute panel px-3 py-2 text-xs pointer-events-none"
          style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%`, transform: "translate(-50%, -110%)" }}
        >
          <div className="font-mono text-mute">{hover.day}</div>
          <div className="font-mono tabular font-semibold">{hover.hours}h</div>
        </div>
      )}
    </div>
  );
}

function Donut({ data }: { data: { name: string; value: number; fill: string }[] }) {
  const size = 200, stroke = 28, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const safe = data.map((d) => ({ ...d, v: Math.max(d.value, 0.001) }));
  const total = safe.reduce((a, b) => a + b.v, 0);
  let acc = 0;
  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A2236" strokeWidth={stroke}/>
        {safe.map((d, i) => {
          const frac = d.v / total;
          const dash = C * frac;
          const offset = C - acc;
          acc += dash;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={d.fill}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 4}  textAnchor="middle" fontSize="22" fontWeight="700" fill="#E6EAF2" fontFamily="JetBrains Mono">{data[0].value}h</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9"  fill="#8892A6" fontFamily="JetBrains Mono" letterSpacing="2">KCNA</text>
      </svg>
    </div>
  );
}

function HourDayHeatmap({ data }: { data: { hours: number[]; days: string[]; cells: { day: string; hour: number; v: number }[] } }) {
  const { hours, days, cells } = data;
  const get = (day: string, hour: number) => cells.find((c) => c.day === day && c.hour === hour)?.v ?? 0;
  return (
    <div>
      <div className="flex">
        <div className="w-10 shrink-0"></div>
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}>
          {hours.map((h) => (
            <div key={h} className="text-[9px] font-mono text-mute text-center">
              {h % 3 === 0 ? String(h).padStart(2,"0") : ""}
            </div>
          ))}
        </div>
      </div>
      {days.map((d) => (
        <div key={d} className="flex items-center mt-1">
          <div className="w-10 shrink-0 text-[10px] font-mono uppercase tracking-wider text-mute pr-2 text-right">{d}</div>
          <div className="flex-1 grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}>
            {hours.map((h) => {
              const v = get(d, h);
              return (
                <div
                  key={h}
                  title={`${d} ${String(h).padStart(2,"0")}:00 — nível ${v}`}
                  className={`h-5 rounded-[3px] hm-${v} hover:ring-1 hover:ring-white/30`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Panel } from "@/components/ui/primitives";
import { EventModal } from "@/components/schedule/event-modal";
import { type SlotType } from "@/lib/mock-data";
import { loadEvents, resetEvents, type ScheduleEvent } from "@/lib/schedule-events";

const HOUR_PX = 32;
const HOURS = Array.from({ length: 25 }, (_, i) => i);
const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const TYPE_META: Record<SlotType, { cls: string; icon: string; label: string }> = {
  study:      { cls: "blk-study",      icon: "book-open",  label: "Estudo" },
  madrugadao: { cls: "blk-madrugadao", icon: "moon",       label: "Madrugadão" },
  sleep:      { cls: "blk-sleep",      icon: "bed",        label: "Sono" },
  run:        { cls: "blk-run",        icon: "footprints", label: "Treino" },
  office:     { cls: "blk-office",     icon: "briefcase",  label: "Escritório" },
};

const toH = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h + m / 60;
};

interface PositionedBlock extends ScheduleEvent {
  _dayIdx: number;
  _s: number;
  _e: number;
  _continues?: boolean;
  _isContinuation?: boolean;
}

type EditingState = ScheduleEvent | { _new: true; day: number; start: string } | null;

export function ScheduleScreen() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [editing, setEditing] = useState<EditingState>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => setEvents(loadEvents()), []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  // Segunda-feira da semana atual
  const monday = useMemo(() => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const todayIdx = useMemo(() => {
    const day = now.getDay();
    return day === 0 ? 6 : day - 1;
  }, [now]);

  const nowH = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const dates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return String(d.getDate()).padStart(2, "0");
    }),
  [monday]);

  const weekRangeLabel = useMemo(() => {
    const end = new Date(monday); end.setDate(monday.getDate() + 6);
    const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
    return `${fmt.format(monday)} a ${fmt.format(end)}`;
  }, [monday]);

  // Expandir eventos: blocos que cruzam meia-noite viram 2 visualmente
  const blocksByDay = useMemo(() => {
    const byDay: PositionedBlock[][] = Array.from({ length: 7 }, () => []);
    events.forEach((ev) => {
      const s = toH(ev.start);
      const e = toH(ev.end);
      if (e <= s) {
        // cruza meia-noite
        byDay[ev.dayOfWeek].push({ ...ev, _dayIdx: ev.dayOfWeek, _s: s, _e: 24, _continues: true });
        const next = (ev.dayOfWeek + 1) % 7;
        byDay[next].unshift({ ...ev, _dayIdx: next, _s: 0, _e: e, _isContinuation: true });
      } else {
        byDay[ev.dayOfWeek].push({ ...ev, _dayIdx: ev.dayOfWeek, _s: s, _e: e });
      }
    });
    return byDay;
  }, [events]);

  // Métricas
  const stats = useMemo(() => {
    let studyHours = 0, madrugadaoHours = 0, doneCount = 0, totalBlocks = 0;
    events.forEach((ev) => {
      const s = toH(ev.start), e = toH(ev.end);
      const dur = e <= s ? (24 - s) + e : e - s;
      if (ev.type === "study") studyHours += dur;
      if (ev.type === "madrugadao") madrugadaoHours += dur;
      if (ev.type === "study" || ev.type === "madrugadao") {
        totalBlocks++;
        if (ev.done) doneCount++;
      }
    });
    return { studyHours, madrugadaoHours, doneCount, totalBlocks };
  }, [events]);

  const weekNumber = useMemo(() => {
    const start = new Date(monday.getFullYear(), 0, 1);
    return Math.ceil((((monday.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  }, [monday]);

  const openEdit = (b: PositionedBlock) => {
    // Edita a fonte original do evento (não a continuação visual)
    const source = events.find((e) => e.id === b.id);
    if (source) setEditing(source);
  };

  const addBlock = (day: number, start: string) => setEditing({ _new: true, day, start });

  const handleResetAll = () => {
    if (!confirm("Resetar todos os blocos pra estrutura padrão?")) return;
    resetEvents();
    refresh();
  };

  return (
    <>
      <TopBar title="Cronograma semanal" subtitle="MC · SCHEDULE" />

      <div className="px-6 py-6 space-y-5">
        <div className="grid grid-cols-12 gap-4">
          <Panel className="col-span-12 lg:col-span-6 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <Eyebrow>Semana {weekNumber} · {weekRangeLabel}</Eyebrow>
                <h2 className="text-lg font-semibold tracking-tight mt-0.5">Janela de operação</h2>
                <div className="text-mute text-xs mt-1">
                  Clique em qualquer bloco pra editar · clique no <span className="text-primary">+</span> de cada dia pra adicionar
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap">
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-mute">
                    <span className={`inline-block w-3 h-3 rounded-sm ${v.cls}`}></span>{v.label}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          <Panel className="col-span-4 lg:col-span-2 p-5 text-center">
            <Eyebrow>Estudo planejado</Eyebrow>
            <div className="text-3xl font-bold tabular tracking-tight mt-1.5">
              {Math.round(stats.studyHours + stats.madrugadaoHours)}<span className="text-base text-mute">h</span>
            </div>
          </Panel>
          <Panel className="col-span-4 lg:col-span-2 p-5 text-center">
            <Eyebrow>Madrugadão</Eyebrow>
            <div className="text-3xl font-bold tabular tracking-tight mt-1.5 text-accent">
              {Math.round(stats.madrugadaoHours)}<span className="text-base text-mute">h</span>
            </div>
          </Panel>
          <Panel className="col-span-4 lg:col-span-2 p-5 text-center">
            <Eyebrow>Concluído</Eyebrow>
            <div className="text-3xl font-bold tabular tracking-tight mt-1.5 text-success">
              {stats.doneCount}<span className="text-base text-mute">/{stats.totalBlocks}</span>
            </div>
          </Panel>
        </div>

        {/* Board */}
        <Panel className="p-4">
          <div className="flex">
            {/* Gutter de horas */}
            <div className="w-14 shrink-0">
              <div className="h-10 mb-2"/>
              <div className="relative" style={{ height: HOUR_PX * 24 }}>
                {HOURS.slice(0, 24).map((h) => (
                  <div
                    key={h}
                    className="absolute right-2 text-[10px] text-mute font-mono tabular leading-none"
                    style={{ top: h * HOUR_PX - 4 }}
                  >
                    {`${String(h).padStart(2,"0")}:00`}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-7 gap-2 min-w-0">
              {blocksByDay.map((blocks, di) => (
                <div key={di} className="relative min-w-0">
                  {/* Header do dia */}
                  <div className={`mb-2 h-10 flex items-center justify-between px-2 rounded-md ${
                    di === todayIdx ? "bg-primary/10 border border-primary/40" : "border border-transparent"
                  }`}>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xs font-mono uppercase tracking-wider ${di === todayIdx ? "text-primary" : "text-mute"}`}>{DAY_LABELS[di]}</span>
                      <span className="text-sm font-bold tabular">{dates[di]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {di === todayIdx && <Badge tone="primary"><div className="w-1 h-1 rounded-full bg-primary pulse-dot"/>HOJE</Badge>}
                      <button
                        onClick={() => addBlock(di, "06:00")}
                        title="Adicionar bloco neste dia"
                        className="w-6 h-6 rounded-md text-mute hover:text-primary hover:bg-primary/10 flex items-center justify-center"
                      >
                        <Icon name="plus" size={12}/>
                      </button>
                    </div>
                  </div>

                  {/* Track */}
                  <div
                    className="relative rounded-md bg-white/[0.015] border border-border/60 cursor-cell"
                    style={{ height: HOUR_PX * 24 }}
                    onDoubleClick={(e) => {
                      // duplo-clique cria bloco na hora clicada
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const h = Math.max(0, Math.min(23, Math.floor(y / HOUR_PX)));
                      addBlock(di, `${String(h).padStart(2,"0")}:00`);
                    }}
                  >
                    {/* Linhas de hora */}
                    {HOURS.slice(0, 24).map((h) => (
                      <div key={h} className="absolute left-0 right-0 border-t border-border/30 pointer-events-none" style={{ top: h * HOUR_PX }}/>
                    ))}

                    {/* Linha "agora" — só no dia de hoje, atualiza a cada 30s */}
                    {hydrated && di === todayIdx && nowH < 24 && (
                      <div
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: nowH * HOUR_PX }}
                      >
                        <div className="w-2 h-2 rounded-full bg-success -ml-1 pulse-dot"/>
                        <div className="flex-1 h-px bg-success/70"/>
                        <span className="text-[9px] font-mono tabular text-success px-1 bg-bg/80 rounded -mr-1">
                          {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}
                        </span>
                      </div>
                    )}

                    {/* Blocos */}
                    {blocks.map((b) => {
                      const meta = TYPE_META[b.type];
                      const top = b._s * HOUR_PX;
                      const height = (b._e - b._s) * HOUR_PX;
                      return (
                        <button
                          key={`${b.id}-${b._dayIdx}-${b._isContinuation ? "c" : "p"}`}
                          onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                          className={`absolute left-1 right-1 rounded-md px-2 py-1.5 text-[11px] overflow-hidden text-left transition-all hover:ring-2 hover:ring-primary/60 hover:z-10 ${meta.cls} ${b.done ? "ring-1 ring-success/50" : ""}`}
                          style={{ top: top + 1, height: height - 2 }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <Icon name={meta.icon} size={11}/>
                              <span className="font-mono tabular text-[10px] truncate">
                                {b._isContinuation ? `← ${b.start}` : b.start}
                              </span>
                            </div>
                            {b.done && <Icon name="check" size={11} className="text-success shrink-0"/>}
                            {b._continues && <Icon name="chevrons-down" size={11} className="text-accent shrink-0"/>}
                            {b._isContinuation && <Icon name="chevrons-up" size={11} className="text-accent shrink-0"/>}
                          </div>
                          {height > 44 && (
                            <div className="mt-1 font-medium leading-tight line-clamp-2">{b.title}</div>
                          )}
                          {height > 80 && b.notes && (
                            <div className="mt-1 text-[10px] text-ink/55 line-clamp-2 leading-snug">{b.notes}</div>
                          )}
                          {height > 110 && (
                            <div className="absolute bottom-1.5 left-2 right-2 text-[10px] font-mono text-ink/55">→ {b.end}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-mute">
            <span>1 clique = editar · duplo-clique no track = criar · + no header do dia = criar</span>
            <button onClick={handleResetAll} className="text-mute hover:text-danger transition-colors">
              <Icon name="rotate-ccw" size={11}/> resetar tudo
            </button>
          </div>
        </Panel>
      </div>

      {editing && "_new" in editing && (
        <EventModal
          defaultDay={editing.day}
          defaultStart={editing.start}
          onClose={(saved) => { setEditing(null); if (saved) refresh(); }}
        />
      )}
      {editing && !("_new" in editing) && (
        <EventModal
          initial={editing}
          onClose={(saved) => { setEditing(null); if (saved) refresh(); }}
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Eyebrow } from "@/components/ui/primitives";
import type { SlotType } from "@/lib/mock-data";
import {
  addEvent, deleteEvent, updateEvent, type ScheduleEvent,
} from "@/lib/schedule-events";

const TYPES: { id: SlotType; label: string; icon: string }[] = [
  { id: "study",      label: "Estudo",      icon: "book-open" },
  { id: "madrugadao", label: "Madrugadão",  icon: "moon" },
  { id: "sleep",      label: "Sono",        icon: "bed" },
  { id: "run",        label: "Treino",      icon: "footprints" },
  { id: "office",     label: "Escritório",  icon: "briefcase" },
];

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface Props {
  initial?: ScheduleEvent | null;
  defaultDay?: number;
  defaultStart?: string;
  onClose: (saved: boolean) => void;
}

export function EventModal({ initial, defaultDay = 0, defaultStart = "06:00", onClose }: Props) {
  const isNew = !initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [type,  setType]  = useState<SlotType>(initial?.type ?? "study");
  const [day,   setDay]   = useState(initial?.dayOfWeek ?? defaultDay);
  const [start, setStart] = useState(initial?.start ?? defaultStart);
  const [end,   setEnd]   = useState(initial?.end ?? incrementHour(defaultStart, 1));
  const [done,  setDone]  = useState(initial?.done ?? false);

  const submit = () => {
    const t = title.trim() || TYPES.find((x) => x.id === type)?.label || "Sem título";
    if (initial) {
      updateEvent(initial.id, { title: t, notes: notes || undefined, type, dayOfWeek: day, start, end, done });
    } else {
      addEvent({ title: t, notes: notes || undefined, type, dayOfWeek: day, start, end, done });
    }
    onClose(true);
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm("Apagar esse bloco?")) return;
    deleteEvent(initial.id);
    onClose(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm" onClick={() => onClose(false)}>
      <div onClick={(e) => e.stopPropagation()} className="panel brackets w-full max-w-lg p-6 relative">
        <button onClick={() => onClose(false)} className="absolute top-4 right-4 text-mute hover:text-ink" aria-label="Fechar">
          <Icon name="x" size={18}/>
        </button>

        <Eyebrow>{isNew ? "Novo bloco" : "Editar bloco"}</Eyebrow>
        <h2 className="text-xl font-bold tracking-tight mt-1">{isNew ? "Programar atividade" : "Atualizar atividade"}</h2>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="eyebrow flex items-center gap-1.5 mb-1.5"><Icon name="type" size={11}/> Título</span>
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: KCNA · Container Orchestration"
              className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="eyebrow flex items-center gap-1.5 mb-1.5"><Icon name="tags" size={11}/> Tipo</span>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider border transition-all ${
                    type === t.id ? "bg-primary/15 text-[#9DB7EF] border-primary/50" : "bg-white/[0.03] text-mute border-border hover:text-ink"
                  }`}
                >
                  <Icon name={t.icon} size={11}/> {t.label}
                </button>
              ))}
            </div>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="eyebrow flex items-center gap-1.5 mb-1.5"><Icon name="calendar-days" size={11}/> Dia</span>
              <select value={day} onChange={(e) => setDay(Number(e.target.value))}
                className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary font-mono">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="eyebrow flex items-center gap-1.5 mb-1.5"><Icon name="play" size={11}/> Início</span>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary font-mono"/>
            </label>

            <label className="block">
              <span className="eyebrow flex items-center gap-1.5 mb-1.5"><Icon name="pause" size={11}/> Fim</span>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary font-mono"/>
            </label>
          </div>

          <label className="block">
            <span className="eyebrow flex items-center gap-1.5 mb-1.5"><Icon name="file-text" size={11}/> Descrição</span>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="o que vai estudar, link da aula, comandos..."
              rows={3}
              className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="accent-success"/>
            <span className="text-sm text-ink">Marcar como concluído</span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            {!isNew && (
              <button onClick={remove} className="btn btn-danger">
                <Icon name="trash-2" size={14}/> Apagar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onClose(false)} className="btn btn-ghost">Cancelar</button>
            <button onClick={submit} className="btn btn-primary">
              <Icon name="check" size={14}/> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function incrementHour(t: string, h: number): string {
  const [hh, mm] = t.split(":").map(Number);
  const next = (hh + h) % 24;
  return `${String(next).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}

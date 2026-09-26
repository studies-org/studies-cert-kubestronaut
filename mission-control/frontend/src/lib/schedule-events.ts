// Eventos do cronograma — persistidos em localStorage (vira API depois)

import type { SlotType } from "@/lib/mock-data";

export interface ScheduleEvent {
  id: string;
  dayOfWeek: number;       // 0=Mon ... 6=Sun
  start: string;           // "HH:MM"
  end: string;             // "HH:MM" — pode cruzar meia-noite (ex: 20:00 → 09:00)
  type: SlotType;
  title: string;
  notes?: string;
  done: boolean;
}

const KEY = "mc.schedule.v1";

function defaults(): ScheduleEvent[] {
  const mk = (d: number, start: string, end: string, type: SlotType, title: string): ScheduleEvent => ({
    id: crypto.randomUUID(), dayOfWeek: d, start, end, type, title, done: false,
  });
  return [
    mk(0, "06:00", "09:00", "study", "Estudo manhã"),
    mk(0, "20:00", "00:00", "study", "Estudo noite"),
    mk(1, "06:00", "09:00", "study", "Estudo manhã"),
    mk(1, "20:00", "00:00", "study", "Estudo noite"),
    mk(2, "06:00", "09:00", "study", "Estudo manhã"),
    mk(2, "20:00", "00:00", "study", "Estudo noite"),
    mk(3, "08:00", "18:00", "office", "Escritório"),
    mk(4, "06:00", "09:00", "study", "Estudo manhã"),
    mk(4, "20:00", "09:00", "madrugadao", "Madrugadão"),
    mk(5, "09:00", "14:00", "sleep", "Recuperação"),
    mk(5, "14:30", "00:00", "study", "Estudo"),
    mk(6, "07:00", "12:00", "run", "Treino"),
    mk(6, "13:00", "00:00", "study", "Estudo"),
  ];
}

export function loadEvents(): ScheduleEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ScheduleEvent[];
  } catch { /* fall through */ }
  const seed = defaults();
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

export function saveEvents(events: ScheduleEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(events));
}

export function addEvent(e: Omit<ScheduleEvent, "id">): ScheduleEvent {
  const events = loadEvents();
  const full: ScheduleEvent = { id: crypto.randomUUID(), ...e };
  events.push(full);
  saveEvents(events);
  return full;
}

export function updateEvent(id: string, patch: Partial<ScheduleEvent>): void {
  const events = loadEvents().map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveEvents(events);
}

export function deleteEvent(id: string): void {
  saveEvents(loadEvents().filter((e) => e.id !== id));
}

export function resetEvents(): ScheduleEvent[] {
  const seed = defaults();
  saveEvents(seed);
  return seed;
}

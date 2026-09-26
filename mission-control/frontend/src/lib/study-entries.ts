// Bitácora entries — persisted in localStorage until backend exists.

import type { Cert } from "@/lib/mock-data";

export type EntryType = "screenshot" | "link" | "note";

export interface StudyEntry {
  id: string;
  type: EntryType;
  title: string;
  cert: Cert["code"] | null;
  imageDataUrl?: string;     // base64 paste/upload
  url?: string;
  notes?: string;            // markdown-ish, just text for now
  createdAt: string;         // ISO
  pinned?: boolean;
}

const KEY = "mc.studyEntries.v1";

export function loadEntries(): StudyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StudyEntry[];
  } catch {
    return [];
  }
}

export function saveEntries(entries: StudyEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addEntry(e: Omit<StudyEntry, "id" | "createdAt"> & { id?: string; createdAt?: string }): StudyEntry {
  const entries = loadEntries();
  const full: StudyEntry = {
    id: e.id ?? crypto.randomUUID(),
    createdAt: e.createdAt ?? new Date().toISOString(),
    ...e,
  } as StudyEntry;
  entries.unshift(full);
  saveEntries(entries);
  return full;
}

export function updateEntry(id: string, patch: Partial<StudyEntry>): void {
  const entries = loadEntries().map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveEntries(entries);
}

export function deleteEntry(id: string): void {
  saveEntries(loadEntries().filter((e) => e.id !== id));
}

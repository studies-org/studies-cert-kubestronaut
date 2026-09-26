"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Panel } from "@/components/ui/primitives";
import { EntryModal } from "@/components/bitacora/entry-modal";
import { certs, type Cert } from "@/lib/mock-data";
import {
  deleteEntry, loadEntries, updateEntry, type StudyEntry,
} from "@/lib/study-entries";

type Filter = "all" | Cert["code"];

export function BitacoraScreen() {
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [filter,  setFilter]  = useState<Filter>("all");
  const [editing, setEditing] = useState<StudyEntry | null | "new">(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = () => setEntries(loadEntries());

  useEffect(() => { refresh(); setHydrated(true); }, []);

  const filtered = useMemo(() => {
    const list = filter === "all" ? entries : entries.filter((e) => e.cert === filter);
    return [...list].sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [entries, filter]);

  const counts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = { all: entries.length };
    certs.forEach((cert) => { c[cert.code] = entries.filter((e) => e.cert === cert.code).length; });
    return c;
  }, [entries]);

  return (
    <>
      <TopBar title="Bitácora · material de estudo" subtitle="MC · BITÁCORA" />

      <div className="px-8 py-6 space-y-5">
        <Panel brackets className="p-5 relative overflow-hidden">
          <div className="absolute -right-32 -top-32 w-[460px] h-[460px] rounded-full bg-primary/15 blur-3xl pointer-events-none"/>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Eyebrow>Diário operacional</Eyebrow>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">Cole prints, embede links, registre tudo</h2>
              <p className="text-mute text-sm mt-1">
                Use <kbd className="font-mono text-xs px-1 py-0.5 rounded bg-white/[0.06] border border-border">Ctrl+V</kbd> dentro do modal pra colar uma screenshot,
                ou cole uma URL — fica salvo no navegador (localStorage). Quando o backend existir, sincroniza pra cloud.
              </p>
            </div>
            <button onClick={() => setEditing("new")} className="btn btn-primary">
              <Icon name="plus" size={14}/> Nova entrada
            </button>
          </div>
        </Panel>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="Tudo" active={filter === "all"} count={counts.all || 0} onClick={() => setFilter("all")} />
          {certs.map((c) => (
            <FilterChip
              key={c.code}
              label={c.code}
              active={filter === c.code}
              count={counts[c.code] || 0}
              onClick={() => setFilter(c.code)}
            />
          ))}
        </div>

        {/* Grid de entradas */}
        {hydrated && filtered.length === 0 ? (
          <EmptyState onAdd={() => setEditing("new")} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((e) => (
              <EntryCard
                key={e.id}
                e={e}
                onEdit={() => setEditing(e)}
                onDelete={() => { if (confirm("Apagar essa entrada?")) { deleteEntry(e.id); refresh(); } }}
                onTogglePin={() => { updateEntry(e.id, { pinned: !e.pinned }); refresh(); }}
              />
            ))}
          </div>
        )}
      </div>

      {editing !== null && (
        <EntryModal
          initial={editing === "new" ? null : editing}
          onClose={(saved) => { setEditing(null); if (saved) refresh(); }}
        />
      )}
    </>
  );
}

function FilterChip({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-all ${
        active ? "bg-primary/15 text-[#9DB7EF] border-primary/50" : "bg-white/[0.03] text-mute border-border hover:text-ink"
      }`}
    >
      {label} <span className={`ml-1 ${active ? "text-ink" : "text-mute"}`}>· {count}</span>
    </button>
  );
}

function EntryCard({
  e, onEdit, onDelete, onTogglePin,
}: { e: StudyEntry; onEdit: () => void; onDelete: () => void; onTogglePin: () => void }) {
  const date = new Date(e.createdAt);
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`panel relative overflow-hidden group ${e.pinned ? "glow-primary" : ""}`}>
      {/* Image */}
      {e.imageDataUrl && (
        <button onClick={onEdit} className="block w-full bg-bg cursor-zoom-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.imageDataUrl} alt={e.title} className="block w-full max-h-44 object-cover" />
        </button>
      )}

      {/* Action bar */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <IconBtn icon={e.pinned ? "pin-off" : "pin"} onClick={onTogglePin} title={e.pinned ? "Desafixar" : "Fixar"} />
        <IconBtn icon="trash-2" onClick={onDelete} title="Apagar" danger />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {e.cert && <Badge tone="primary">{e.cert}</Badge>}
          <Badge tone="mute">
            <Icon name={e.type === "screenshot" ? "image-plus" : e.type === "link" ? "link" : "notebook-pen"} size={11}/>
            {e.type === "screenshot" ? "print" : e.type === "link" ? "link" : "nota"}
          </Badge>
          {e.pinned && <Icon name="pin" size={11} className="text-accent"/>}
        </div>

        <button onClick={onEdit} className="block text-left w-full">
          <h3 className="text-sm font-semibold tracking-tight leading-tight line-clamp-2">{e.title}</h3>
        </button>

        {e.url && (
          <a
            href={e.url} target="_blank" rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-primary/80 hover:text-primary truncate"
          >
            <Icon name="external-link" size={11}/>{safeHost(e.url)}
          </a>
        )}

        {e.notes && (
          <p className="mt-2 text-xs text-ink/75 leading-relaxed line-clamp-3 whitespace-pre-wrap">{e.notes}</p>
        )}

        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-mute">
          <span>{dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ icon, onClick, title, danger }: { icon: string; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick} title={title}
      className={`w-7 h-7 rounded-md bg-bg/80 backdrop-blur-md border border-border flex items-center justify-center transition-all
        ${danger ? "hover:text-danger hover:border-danger/50" : "hover:text-primary hover:border-primary/50"} text-mute`}
    >
      <Icon name={icon} size={12}/>
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Panel className="p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
        <Icon name="notebook-pen" size={28} className="text-primary"/>
      </div>
      <h3 className="text-lg font-semibold tracking-tight mt-4">Bitácora vazia</h3>
      <p className="text-mute text-sm mt-1 max-w-md mx-auto">
        Quando achar algo legal estudando — um print de um diagrama, um link de aula —
        registra aqui pra revisar depois.
      </p>
      <button onClick={onAdd} className="btn btn-primary mt-5 mx-auto">
        <Icon name="plus" size={14}/> Primeira entrada
      </button>
    </Panel>
  );
}

function safeHost(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, ""); }
  catch { return u; }
}

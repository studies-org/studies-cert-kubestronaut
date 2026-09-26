"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow } from "@/components/ui/primitives";
import { certs } from "@/lib/mock-data";
import { addEntry, updateEntry, type StudyEntry } from "@/lib/study-entries";

interface Props {
  initial?: StudyEntry | null;
  onClose: (saved: boolean) => void;
}

export function EntryModal({ initial, onClose }: Props) {
  const [title,   setTitle]   = useState(initial?.title ?? "");
  const [cert,    setCert]    = useState<StudyEntry["cert"]>(initial?.cert ?? "KCNA");
  const [url,     setUrl]     = useState(initial?.url ?? "");
  const [notes,   setNotes]   = useState(initial?.notes ?? "");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(initial?.imageDataUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  // Global paste handler — captures clipboard images
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) readAsDataUrl(f, setImageDataUrl);
          e.preventDefault();
          return;
        }
      }
      const text = e.clipboardData?.getData("text");
      if (text && /^https?:\/\//.test(text) && !url) {
        setUrl(text);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [url]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith("image/")) readAsDataUrl(f, setImageDataUrl);
  };

  const submit = () => {
    if (!title.trim() && !url.trim() && !imageDataUrl && !notes.trim()) {
      onClose(false);
      return;
    }
    const type: StudyEntry["type"] = imageDataUrl ? "screenshot" : url ? "link" : "note";
    const finalTitle = title.trim() || (url ? new URL(url).hostname : "Anotação rápida");

    if (initial) {
      updateEntry(initial.id, { title: finalTitle, cert, url: url || undefined, notes: notes || undefined, imageDataUrl, type });
    } else {
      addEntry({ title: finalTitle, cert, url: url || undefined, notes: notes || undefined, imageDataUrl, type });
    }
    onClose(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm" onClick={() => onClose(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel brackets w-full max-w-2xl max-h-[90vh] overflow-auto p-6 relative"
      >
        <button onClick={() => onClose(false)} className="absolute top-4 right-4 text-mute hover:text-ink" aria-label="Fechar">
          <Icon name="x" size={18}/>
        </button>

        <Eyebrow>{initial ? "Editar entrada" : "Nova entrada · Bitácora"}</Eyebrow>
        <h2 className="text-xl font-bold tracking-tight mt-1">
          {initial ? initial.title : "Registrar material"}
        </h2>
        <p className="text-mute text-xs mt-1">
          Cole prints (Ctrl+V), URLs, ou arraste imagens pra cá. Tudo fica salvo localmente.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {/* Image / paste area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className="relative border-2 border-dashed border-border rounded-xl bg-white/[0.02] cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
            style={{ minHeight: imageDataUrl ? "auto" : 160 }}
          >
            {imageDataUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="" className="block w-full max-h-80 object-contain bg-bg" />
                <button
                  onClick={(e) => { e.stopPropagation(); setImageDataUrl(undefined); }}
                  className="absolute top-2 right-2 bg-bg/80 backdrop-blur-md border border-border rounded-md px-2 py-1 text-xs font-mono text-mute hover:text-danger"
                >
                  <Icon name="x" size={11}/> remover
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-mute">
                <Icon name="image-plus" size={28} className="text-primary mb-2"/>
                <div className="text-sm">Ctrl+V pra colar um print</div>
                <div className="text-[10px] font-mono uppercase tracking-wider mt-1">ou clique p/ escolher arquivo</div>
              </div>
            )}
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readAsDataUrl(f, setImageDataUrl);
              }}
            />
          </div>

          {/* URL */}
          <Field label="Link (opcional)" icon="link">
            <input
              value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://kodekloud.com/lessons/..."
              className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-primary"
            />
          </Field>

          {/* Title */}
          <Field label="Título" icon="type">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: kubectl rollout — restart vs status"
              className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>

          {/* Cert tag */}
          <Field label="Certificação" icon="graduation-cap">
            <div className="flex flex-wrap gap-1.5">
              <CertChip code={null} active={cert === null} onClick={() => setCert(null)} />
              {certs.map((c) => (
                <CertChip key={c.code} code={c.code} active={cert === c.code} onClick={() => setCert(c.code)} />
              ))}
            </div>
          </Field>

          {/* Notes */}
          <Field label="Notas" icon="file-text">
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="o que aprendi, dúvidas, comandos..."
              rows={4}
              className="w-full bg-white/[0.03] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={() => onClose(false)} className="btn btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn btn-primary">
            <Icon name="check" size={14}/> {initial ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow flex items-center gap-1.5 mb-1.5"><Icon name={icon} size={11}/> {label}</span>
      {children}
    </label>
  );
}

function CertChip({ code, active, onClick }: { code: StudyEntry["cert"]; active: boolean; onClick: () => void }) {
  const label = code ?? "Sem cert";
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border transition-all ${
        active ? "bg-primary/15 text-[#9DB7EF] border-primary/50" : "bg-white/[0.03] text-mute border-border hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function readAsDataUrl(file: File, cb: (s: string) => void) {
  const fr = new FileReader();
  fr.onload = () => cb(fr.result as string);
  fr.readAsDataURL(file);
}

// Suppress unused-import-on-Badge — kept for future filter chips
void Badge;

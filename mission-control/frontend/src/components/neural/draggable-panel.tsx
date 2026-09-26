"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  loadHudPositions, saveHudPosition, type HudId, type Vec2,
} from "@/lib/ui-prefs";

interface Props {
  id: HudId;
  defaultPos: Vec2;
  width: number;
  title: string;
  eyebrowColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function DraggablePanel({
  id, defaultPos, width, title, eyebrowColor = "#9DB7EF", children, className,
}: Props) {
  const [pos, setPos] = useState<Vec2>(defaultPos);
  const [hydrated, setHydrated] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number; px: number; py: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadHudPositions()[id];
    if (saved) setPos(saved);
    setHydrated(true);
  }, [id]);

  // Reset event — disparado pelo control cluster
  useEffect(() => {
    const onReset = () => setPos(defaultPos);
    window.addEventListener("mc:hud-reset", onReset);
    return () => window.removeEventListener("mc:hud-reset", onReset);
  }, [defaultPos]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, kbd, input")) return;
    dragRef.current = { ox: pos.x, oy: pos.y, px: e.clientX, py: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const d = dragRef.current;
    const next = { x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) };
    // Clamp permissivo: deixa o painel ir quase pra qualquer lugar,
    // só garante que reste pelo menos 80px do header visível pra
    // poder arrastar de volta. SEMPRE permite mover, mesmo com zoom.
    const w = panelRef.current?.offsetWidth ?? width;
    const visW = window.innerWidth;
    const visH = window.innerHeight;
    const MIN_VISIBLE = 80;
    next.x = Math.max(-(w - MIN_VISIBLE), Math.min(visW - MIN_VISIBLE, next.x));
    next.y = Math.max(0, Math.min(visH - 40, next.y));
    setPos(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    saveHudPosition(id, pos);
  };

  // Previne que scroll dentro do painel dê zoom no cérebro
  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={panelRef}
      onWheel={onWheel}
      className={`absolute z-30 panel brackets backdrop-blur-md bg-bg/70 ${className ?? ""}`}
      style={{
        left: pos.x, top: pos.y, width,
        visibility: hydrated ? "visible" : "hidden",
        touchAction: "none",
      }}
    >
      {/* Drag handle — área generosa pra agarrar com facilidade */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60 cursor-grab active:cursor-grabbing select-none hover:bg-white/[0.02] transition-colors"
        title="Arraste pra mover"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Grip dots — pista visual de drag */}
          <svg width="8" height="14" viewBox="0 0 8 14" className="text-mute opacity-50 shrink-0" fill="currentColor">
            <circle cx="2" cy="2"  r="1.2"/><circle cx="6" cy="2"  r="1.2"/>
            <circle cx="2" cy="7"  r="1.2"/><circle cx="6" cy="7"  r="1.2"/>
            <circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>
          </svg>
          <div className="eyebrow truncate" style={{ color: eyebrowColor }}>{title}</div>
        </div>
        <Icon name="panels-top-left" size={11} className="text-mute opacity-40 shrink-0" />
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  cycleSidebarMode, loadSidebarMode, saveSidebarMode, type SidebarMode,
} from "@/lib/ui-prefs";

const NAV = [
  { href: "/",            label: "Dashboard",      icon: "layout-dashboard" },
  { href: "/neural",      label: "Neural Mission", icon: "brain", badge: "NEW" },
  { href: "/pomodoro",    label: "Pomodoro",       icon: "timer" },
  { href: "/cronograma",  label: "Cronograma",     icon: "calendar-days" },
  { href: "/bitacora",    label: "Bitácora",       icon: "notebook-pen", badge: "NEW" },
  { href: "/certs",       label: "Certs",          icon: "graduation-cap" },
  { href: "/stats",       label: "Stats",          icon: "bar-chart-3" },
] as const;

export function useSidebarMode(): [SidebarMode, (m: SidebarMode | ((prev: SidebarMode) => SidebarMode)) => void] {
  const [mode, setModeState] = useState<SidebarMode>("expanded");

  useEffect(() => {
    setModeState(loadSidebarMode());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<SidebarMode>).detail;
      if (detail) setModeState(detail);
    };
    window.addEventListener("mc:sidebar-change", onChange);
    return () => window.removeEventListener("mc:sidebar-change", onChange);
  }, []);

  const setMode = (m: SidebarMode | ((prev: SidebarMode) => SidebarMode)) => {
    const next = typeof m === "function" ? m(mode) : m;
    setModeState(next);
    saveSidebarMode(next);
  };

  return [mode, setMode];
}

export function Sidebar() {
  const pathname = usePathname();
  const [mode, setMode] = useSidebarMode();

  // Atalho de teclado: [
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "[") setMode((m) => cycleSidebarMode(m));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mode === "hidden") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const compact = mode === "compact";
  const width = compact ? "w-[64px]" : "w-[232px]";

  return (
    <aside className={`${width} shrink-0 h-screen sticky top-0 border-r border-border/70 bg-bg/60 backdrop-blur-md z-10 flex flex-col transition-[width] duration-200`}>
      <div className={`flex items-center gap-2.5 ${compact ? "px-3 py-5 justify-center" : "px-5 py-5"}`}>
        <Link href="/" className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#1a4ab5] flex items-center justify-center glow-primary shrink-0">
          <Icon name="rocket" size={18} className="text-white" />
        </Link>
        {!compact && (
          <div className="min-w-0">
            <div className="text-[15px] font-bold tracking-tight leading-none">Mission Control</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-mute mt-1">v0.1 · kubestronaut</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              title={compact ? n.label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                compact ? "justify-center" : ""
              } ${active ? "bg-primary/12 text-white nav-rail" : "text-mute hover:text-ink hover:bg-white/[0.03]"}`}
            >
              <Icon name={n.icon} size={17} />
              {!compact && <span className="font-medium">{n.label}</span>}
              {!compact && "badge" in n && n.badge && !active && (
                <span className="ml-auto text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/40">
                  {n.badge}
                </span>
              )}
              {!compact && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />}
            </Link>
          );
        })}
      </nav>

      {!compact && (
        <div className="p-3">
          <div className="panel p-3 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
              <span className="eyebrow">Sistema</span>
            </div>
            <div className="flex justify-between text-mute"><span>Telemetria</span><span className="text-success font-mono">ONLINE</span></div>
            <div className="flex justify-between text-mute"><span>Latência</span><span className="font-mono text-ink">12ms</span></div>
            <div className="flex justify-between text-mute"><span>Cluster</span><span className="font-mono text-ink">mc-prod</span></div>
          </div>
        </div>
      )}

      {/* Toggle no rodapé */}
      <button
        onClick={() => setMode((m) => cycleSidebarMode(m))}
        title={`Modo: ${mode} · tecla [`}
        className={`m-2 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-border/70 bg-white/[0.02] text-mute hover:text-ink hover:border-primary/50 transition-all ${
          compact ? "justify-center" : ""
        }`}
      >
        <Icon name={compact ? "chevron-right" : "chevron-left"} size={14} />
        {!compact && (
          <>
            <span className="text-[11px] font-mono uppercase tracking-wider">colapsar</span>
            <kbd className="ml-auto text-[9px] font-mono bg-white/[0.06] px-1 rounded">[</kbd>
          </>
        )}
      </button>
    </aside>
  );
}

// Botão flutuante que aparece SÓ quando sidebar está hidden
export function SidebarReopenButton() {
  const [mode, setMode] = useSidebarMode();
  if (mode !== "hidden") return null;
  return (
    <button
      onClick={() => setMode("expanded")}
      title="Abrir sidebar (tecla [ )"
      className="fixed top-4 left-4 z-40 w-10 h-10 rounded-lg panel-flat backdrop-blur-md flex items-center justify-center text-mute hover:text-ink hover:border-primary/50 transition-all"
    >
      <Icon name="panels-top-left" size={16} />
    </button>
  );
}

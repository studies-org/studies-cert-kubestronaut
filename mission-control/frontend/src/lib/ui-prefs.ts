// Preferências de UI persistidas no navegador.

export type SidebarMode = "expanded" | "compact" | "hidden";

const KEYS = {
  sidebar: "mc.ui.sidebar.v1",
  hudPos:  "mc.ui.neural.hud.v1",
};

export function loadSidebarMode(): SidebarMode {
  if (typeof window === "undefined") return "expanded";
  return (localStorage.getItem(KEYS.sidebar) as SidebarMode) || "expanded";
}

export function saveSidebarMode(mode: SidebarMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.sidebar, mode);
  // notify same-tab listeners
  window.dispatchEvent(new CustomEvent("mc:sidebar-change", { detail: mode }));
}

export function cycleSidebarMode(mode: SidebarMode): SidebarMode {
  return mode === "expanded" ? "compact" : mode === "compact" ? "hidden" : "expanded";
}

export interface Vec2 { x: number; y: number }
export type HudId = "session" | "agg" | "regions" | "legend";

export type HudPositions = Partial<Record<HudId, Vec2>>;

export function loadHudPositions(): HudPositions {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEYS.hudPos) || "{}"); }
  catch { return {}; }
}

export function saveHudPosition(id: HudId, pos: Vec2): void {
  if (typeof window === "undefined") return;
  const all = loadHudPositions();
  all[id] = pos;
  localStorage.setItem(KEYS.hudPos, JSON.stringify(all));
}

export function resetHudPositions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.hudPos);
}

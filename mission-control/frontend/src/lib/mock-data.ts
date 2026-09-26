// Mission Control — initial empty state (no real data yet).
// Quando o backend existir, esses fallbacks ficam só pra SSR/skeleton.

export interface User { name: string; avatar: string }

export interface Cert {
  code: "KCNA" | "KCSA" | "CKAD" | "CKA" | "CKS";
  name: string;
  progress: number;
  status: "pending" | "in_progress" | "passed" | "failed";
  hours: number;
  examDate: string | null;
  color: string;
}

export interface CertDomain {
  name: string;
  weight: number;
  progress: number;
  hoursLogged: number;
  pomodoroCount: number;
  sessionsLast7d: number;
  lastSessionDaysAgo: number | null;
}

export interface NextSession {
  when: string; cert: string; focus: string; resource: string; duration: string;
}

export interface LastSession {
  cert: string; duration: string; pomodoros: number; mode: string; note: string; date: string;
}

export type PomodoroModeId = "quick" | "classic" | "long" | "ultradian" | "madrugadao";
export interface PomodoroMode { id: PomodoroModeId; label: string; focus: number; break: number; use: string }

export type SlotType = "study" | "madrugadao" | "sleep" | "run" | "office";
export interface DayBlock { start: string; end: string; type: SlotType; done: boolean; label: string }
export interface WeekDay { day: string; date: string; blocks: DayBlock[] }

export interface Achievement { icon: string; title: string; desc: string; date: string; unlocked: boolean }

export const user: User = { name: "Astronauta", avatar: "AS" };

// ─── Métricas zeradas (pré-primeiro-estudo) ───────────────────────
export const streak = 0;
export const weeklyHours = 0;
export const weeklyTarget = 57;
export const pomodorosToday = 0;
export const pomodorosTodayTarget = 12;

export const certs: Cert[] = [
  { code: "KCNA", name: "Kubernetes and Cloud Native Associate",          progress: 0, status: "pending", hours: 0, examDate: null, color: "primary" },
  { code: "KCSA", name: "Kubernetes and Cloud Native Security Associate", progress: 0, status: "pending", hours: 0, examDate: null, color: "primary" },
  { code: "CKAD", name: "Certified Kubernetes Application Developer",     progress: 0, status: "pending", hours: 0, examDate: null, color: "primary" },
  { code: "CKA",  name: "Certified Kubernetes Administrator",             progress: 0, status: "pending", hours: 0, examDate: null, color: "primary" },
  { code: "CKS",  name: "Certified Kubernetes Security Specialist",       progress: 0, status: "pending", hours: 0, examDate: null, color: "primary" },
];

const zeroDomain = (name: string, weight: number): CertDomain => ({
  name, weight, progress: 0, hoursLogged: 0, pomodoroCount: 0, sessionsLast7d: 0, lastSessionDaysAgo: null,
});

export const certDomains: Record<Cert["code"], CertDomain[]> = {
  KCNA: [
    zeroDomain("Kubernetes Fundamentals", 46),
    zeroDomain("Container Orchestration", 22),
    zeroDomain("Cloud Native Architecture", 16),
    zeroDomain("Cloud Native Observability", 8),
    zeroDomain("Cloud Native Application Delivery", 8),
  ],
  KCSA: [
    zeroDomain("Overview of Cloud Native Security", 14),
    zeroDomain("Kubernetes Cluster Security", 22),
    zeroDomain("Kubernetes Threat Model", 16),
    zeroDomain("Platform Security", 16),
    zeroDomain("Compliance and Security Frameworks", 10),
  ],
  CKAD: [
    zeroDomain("Application Design and Build", 20),
    zeroDomain("Application Deployment", 20),
    zeroDomain("Application Observability", 15),
    zeroDomain("Application Environment", 25),
    zeroDomain("Services and Networking", 20),
  ],
  CKA: [
    zeroDomain("Cluster Architecture", 25),
    zeroDomain("Workloads and Scheduling", 15),
    zeroDomain("Services and Networking", 20),
    zeroDomain("Storage", 10),
    zeroDomain("Troubleshooting", 30),
  ],
  CKS: [
    zeroDomain("Cluster Setup", 10),
    zeroDomain("Cluster Hardening", 15),
    zeroDomain("System Hardening", 15),
    zeroDomain("Minimize Microservice Vulnerabilities", 20),
    zeroDomain("Supply Chain Security", 20),
    zeroDomain("Monitoring, Logging and Runtime Security", 20),
  ],
};

export const nextSession: NextSession | null = null;
export const lastSession: LastSession | null = null;

// 12 semanas x 7 dias — tudo zerado
export const heatmap: number[][] = Array.from({ length: 12 }, () => Array.from({ length: 7 }, () => 0));

export const pomodoroModes: PomodoroMode[] = [
  { id: "quick",      label: "Quick",      focus: 15, break: 5,  use: "Revisão rápida" },
  { id: "classic",    label: "Classic",    focus: 25, break: 5,  use: "Estudo teórico" },
  { id: "long",       label: "Long",       focus: 50, break: 10, use: "Labs hands-on" },
  { id: "ultradian",  label: "Ultradian",  focus: 90, break: 20, use: "Deep work" },
  { id: "madrugadao", label: "Madrugadão", focus: 90, break: 20, use: "Sessão noturna longa" },
];

// Cronograma planejado fica — é estrutural, não "dado de estudo"
export const week: WeekDay[] = [
  { day: "Seg", date: "—", blocks: [
    { start: "06:00", end: "09:00", type: "study", done: false, label: "Estudo manhã" },
    { start: "20:00", end: "00:00", type: "study", done: false, label: "Estudo noite" },
  ]},
  { day: "Ter", date: "—", blocks: [
    { start: "06:00", end: "09:00", type: "study", done: false, label: "Estudo manhã" },
    { start: "20:00", end: "00:00", type: "study", done: false, label: "Estudo noite" },
  ]},
  { day: "Qua", date: "—", blocks: [
    { start: "06:00", end: "09:00", type: "study", done: false, label: "Estudo manhã" },
    { start: "20:00", end: "00:00", type: "study", done: false, label: "Estudo noite" },
  ]},
  { day: "Qui", date: "—", blocks: [
    { start: "00:00", end: "23:59", type: "office", done: false, label: "Escritório" },
  ]},
  { day: "Sex", date: "—", blocks: [
    { start: "06:00", end: "09:00", type: "study", done: false, label: "Estudo manhã" },
    { start: "20:00", end: "09:00", type: "madrugadao", done: false, label: "Madrugadão" },
  ]},
  { day: "Sáb", date: "—", blocks: [
    { start: "09:00", end: "14:00", type: "sleep", done: false, label: "Recuperação" },
    { start: "14:30", end: "00:00", type: "study", done: false, label: "Estudo" },
  ]},
  { day: "Dom", date: "—", blocks: [
    { start: "07:00", end: "12:00", type: "run", done: false, label: "Treino" },
    { start: "13:00", end: "00:00", type: "study", done: false, label: "Estudo" },
  ]},
];

export const dailyHours: { day: string; hours: number }[] = (() => {
  const out: { day: string; hours: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      day: `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth() + 1).toString().padStart(2,"0")}`,
      hours: 0,
    });
  }
  return out;
})();

export const certTimeSplit = [
  { name: "KCNA", value: 0, fill: "#326CE5" },
  { name: "KCSA", value: 0, fill: "#5E8BEA" },
  { name: "CKAD", value: 0, fill: "#8AAAF0" },
  { name: "CKA",  value: 0, fill: "#B6C8F6" },
  { name: "CKS",  value: 0, fill: "#E3E9FB" },
];

export const pomoHeatmap = (() => {
  const hours = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3];
  const days = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  const cells: { day: string; hour: number; v: number }[] = [];
  days.forEach((d) => hours.forEach((h) => cells.push({ day: d, hour: h, v: 0 })));
  return { hours, days, cells };
})();

export const achievements: Achievement[] = [
  { icon: "rocket",         title: "Liftoff",            desc: "Primeira sessão concluída", date: "—", unlocked: false },
  { icon: "flame",          title: "Streak ×7",          desc: "7 dias consecutivos",       date: "—", unlocked: false },
  { icon: "flame",          title: "Streak ×14",         desc: "Duas semanas em órbita",    date: "—", unlocked: false },
  { icon: "timer",          title: "Pomodoro ×100",      desc: "100 ciclos completados",    date: "—", unlocked: false },
  { icon: "moon",           title: "Madrugadão",         desc: "Vire a noite uma vez",      date: "—", unlocked: false },
  { icon: "graduation-cap", title: "KCNA",               desc: "Primeira cert no bolso",    date: "—", unlocked: false },
  { icon: "shield-check",   title: "Kubestronaut",       desc: "Todas as 5 certs",          date: "—", unlocked: false },
  { icon: "trending-up",    title: "57h em uma semana",  desc: "Meta semanal atingida",     date: "—", unlocked: false },
];

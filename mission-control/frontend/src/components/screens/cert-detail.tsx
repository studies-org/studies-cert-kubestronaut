"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Panel, Progress } from "@/components/ui/primitives";
import { certs, certDomains } from "@/lib/mock-data";

const RECENT_SESSIONS = [
  { date: "16/05 · Ontem",   dur: "3h 20min", pomos: 4, mode: "Long",    note: "Componentes do K8s — api-server, etcd, scheduler, controller-manager" },
  { date: "15/05 · Quarta",  dur: "2h 40min", pomos: 4, mode: "Classic", note: "Kubelet, kube-proxy, container runtime — fluxo do Pod até estar Running" },
  { date: "14/05 · Terça",   dur: "4h 10min", pomos: 5, mode: "Long",    note: "Lab KodeKloud: kubectl rollout, rollback, history" },
  { date: "13/05 · Segunda", dur: "3h 00min", pomos: 4, mode: "Classic", note: "Conceitos cloud native — pilares CNCF e mapa do ecossistema" },
];

export function CertDetailScreen({ code }: { code: string }) {
  const cert = certs.find((c) => c.code === code);
  if (!cert) notFound();

  const domains = certDomains[cert.code] || [];
  const isActive = cert.status === "in_progress";

  return (
    <>
      <TopBar title={`Certificação · ${cert.code}`} subtitle="MC · CERTS" />

      <div className="px-8 py-6 space-y-5">
        <Link href="/certs" className="btn btn-ghost">
          <Icon name="arrow-left" size={14}/> Todas as certificações
        </Link>

        <Panel brackets className="p-6 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/15 blur-3xl pointer-events-none"/>
          <div className="flex items-start justify-between relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[#1a4ab5] flex items-center justify-center glow-primary">
                <span className="font-bold text-lg font-mono">{cert.code}</span>
              </div>
              <div>
                <Eyebrow>CNCF · Kubernetes Certifications</Eyebrow>
                <h1 className="text-3xl font-bold tracking-tight mt-1">{cert.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {isActive
                    ? <Badge tone="primary"><div className="w-1 h-1 rounded-full bg-primary pulse-dot"/>EM CURSO</Badge>
                    : <Badge tone="mute">PENDING</Badge>}
                  <span className="text-mute text-sm">{cert.hours}h dedicadas</span>
                  <span className="text-border">·</span>
                  <span className="text-mute text-sm">prova {cert.examDate || "não marcada"}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow">Progresso</div>
              <div className="text-5xl font-bold tabular text-glow-primary leading-none mt-1">{cert.progress}<span className="text-mute text-xl">%</span></div>
            </div>
          </div>

          <div className="mt-5"><Progress value={cert.progress} thick tone="primary"/></div>
        </Panel>

        <div className="grid grid-cols-12 gap-5">
          <Panel className="col-span-12 lg:col-span-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Eyebrow>Domínios da prova</Eyebrow>
                <h2 className="text-lg font-semibold tracking-tight mt-0.5">Progresso por área</h2>
              </div>
              <div className="text-xs text-mute font-mono">peso = % da prova</div>
            </div>

            <div className="space-y-4">
              {domains.map((d, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-5">
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-mute mt-0.5">peso {d.weight}%</div>
                  </div>
                  <div className="col-span-6">
                    <Progress value={d.progress} tone={d.progress > 0 ? "primary" : "mute"} thick showPct />
                  </div>
                  <div className="col-span-1 text-right">
                    {d.progress >= 100 ? <Icon name="check-circle-2" size={16} className="text-success ml-auto"/>
                      : d.progress > 0 ? <div className="w-2 h-2 rounded-full bg-primary pulse-dot ml-auto"/>
                      : <div className="w-2 h-2 rounded-full bg-white/10 ml-auto"/>}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="col-span-12 lg:col-span-4 space-y-5">
            <Panel className="p-5">
              <Eyebrow>Próximo objetivo</Eyebrow>
              <div className="mt-3 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center shrink-0">
                  <Icon name="target" size={18} className="text-accent"/>
                </div>
                <div>
                  <div className="font-semibold">Finalizar Container Orchestration</div>
                  <div className="text-xs text-mute mt-1">Pomodoros restantes estimados: <span className="font-mono tabular text-ink">14</span></div>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <Eyebrow>Recursos</Eyebrow>
              <div className="mt-3 space-y-2">
                <a className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-border/70 hover:border-primary/50 transition-all">
                  <div className="w-9 h-9 rounded-md bg-primary/15 flex items-center justify-center"><Icon name="book-open" size={16} className="text-primary"/></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">KodeKloud</div>
                    <div className="text-[11px] text-mute">Curso oficial · 8 módulos</div>
                  </div>
                  <Icon name="external-link" size={14} className="text-mute"/>
                </a>
                <a className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-border/70 hover:border-primary/50 transition-all">
                  <div className="w-9 h-9 rounded-md bg-accent/15 flex items-center justify-center"><Icon name="book" size={16} className="text-accent"/></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Descomplicando Kubernetes</div>
                    <div className="text-[11px] text-mute">LinuxTips · pt-BR</div>
                  </div>
                  <Icon name="external-link" size={14} className="text-mute"/>
                </a>
              </div>
            </Panel>
          </div>
        </div>

        <Panel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Bitácora · sessões recentes</Eyebrow>
              <h2 className="text-lg font-semibold tracking-tight mt-0.5">Últimos registros vinculados</h2>
            </div>
            <button className="btn btn-ghost">
              <Icon name="file-text" size={14}/> Ver tudo
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {RECENT_SESSIONS.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 py-3 items-center">
                <div className="col-span-2 text-xs font-mono tabular text-mute">{s.date}</div>
                <div className="col-span-2 font-mono tabular text-sm">{s.dur}</div>
                <div className="col-span-1"><Badge tone="primary">{s.mode}</Badge></div>
                <div className="col-span-1 text-xs font-mono text-mute">{s.pomos} pomos</div>
                <div className="col-span-6 text-sm text-ink/85 truncate">{s.note}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

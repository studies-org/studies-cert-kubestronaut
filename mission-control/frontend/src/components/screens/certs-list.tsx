"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Panel, Progress } from "@/components/ui/primitives";
import { certs, certDomains, type Cert } from "@/lib/mock-data";

export function CertsListScreen() {
  return (
    <>
      <TopBar title="Certificações" subtitle="MC · CERTS" />

      <div className="px-8 py-6 space-y-5">
        <div className="grid grid-cols-12 gap-5">
          <Panel brackets className="col-span-12 p-6 relative overflow-hidden">
            <div className="absolute -right-32 -top-32 w-[500px] h-[500px] rounded-full bg-primary/15 blur-3xl pointer-events-none"/>
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                  <Icon name="shield-check" size={26} className="text-white"/>
                </div>
                <div>
                  <Eyebrow>Destino · 12 meses</Eyebrow>
                  <h2 className="text-2xl font-bold tracking-tight">Kubestronaut · 5/5</h2>
                  <div className="text-mute text-sm mt-0.5">Todas as 5 certificações Kubernetes da CNCF</div>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <div className="eyebrow">Progresso global</div>
                <div className="text-3xl font-bold tabular text-glow-primary">8<span className="text-mute text-lg">%</span></div>
              </div>
            </div>
          </Panel>

          {certs.map((c, i) => (
            <CertCard key={c.code} cert={c} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}

function CertCard({ cert, index }: { cert: Cert; index: number }) {
  const isActive = cert.status === "in_progress";
  const domains = certDomains[cert.code] || [];
  return (
    <Link
      href={`/certs/${cert.code}`}
      className={`col-span-12 md:col-span-6 lg:col-span-4 panel p-5 text-left clickcard ${isActive ? "glow-primary" : ""} relative`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
            isActive ? "bg-primary text-white" : "bg-white/[0.06] text-mute"
          }`}>
            0{index + 1}
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">{cert.code}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute">CNCF · KUBERNETES</div>
          </div>
        </div>
        {isActive
          ? <Badge tone="primary"><div className="w-1 h-1 rounded-full bg-primary pulse-dot"/>EM CURSO</Badge>
          : <Badge tone="mute">PENDING</Badge>}
      </div>

      <div className="mt-3 text-sm text-ink/85 line-clamp-2 h-10">{cert.name}</div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-mute mb-1.5">
          <span>Progresso</span>
          <span className={isActive ? "text-ink" : ""}>{cert.progress}%</span>
        </div>
        <Progress value={cert.progress} tone={isActive ? "primary" : "mute"} thick />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Horas" value={`${cert.hours}h`} />
        <Stat label="Domínios" value={`${domains.length}`} />
        <Stat label="Prova" value={cert.examDate || "—"} />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.02] border border-border/60 py-2">
      <div className="text-[9px] font-mono uppercase tracking-wider text-mute">{label}</div>
      <div className="text-sm font-mono tabular font-semibold mt-0.5">{value}</div>
    </div>
  );
}

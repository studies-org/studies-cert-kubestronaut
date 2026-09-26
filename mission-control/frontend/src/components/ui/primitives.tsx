import clsx from "clsx";

export function Panel({
  children, className, brackets = false, ...rest
}: { children: React.ReactNode; className?: string; brackets?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("panel", brackets && "brackets", className)} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("eyebrow", className)}>{children}</div>;
}

type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "mute";
const TONES: Record<Tone, string> = {
  primary: "bg-primary/15 text-[#9DB7EF] border-primary/40",
  accent:  "bg-accent/15  text-[#FFB28C] border-accent/40",
  success: "bg-success/10 text-[#7AE9CC] border-success/40",
  warning: "bg-warning/15 text-[#FFE0A0] border-warning/40",
  danger:  "bg-danger/15  text-[#FF9AA4] border-danger/40",
  mute:    "bg-white/5    text-mute        border-border",
};

export function Badge({
  children, tone = "primary", className,
}: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
      TONES[tone],
      className,
    )}>
      {children}
    </span>
  );
}

export function Progress({
  value, max = 100, tone = "primary", thick = false, showPct = false,
}: { value: number; max?: number; tone?: Tone; thick?: boolean; showPct?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    tone === "accent"  ? "from-[#FF8551] to-[#FF5A1F]" :
    tone === "success" ? "from-[#3FE7BB] to-[#00B98B]" :
    tone === "warning" ? "from-[#FFD978] to-[#F0AE34]" :
                         "from-[#5E92F5] to-[#2A5DCE]";
  const shadow = tone === "accent" ? "0 0 12px rgba(255,107,53,.5)" : "0 0 10px rgba(50,108,229,.45)";
  return (
    <div className="w-full flex items-center gap-3">
      <div className={clsx("relative flex-1 rounded-full bg-white/[0.04] overflow-hidden", thick ? "h-2.5" : "h-1.5")}>
        <div
          className={clsx("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", fill)}
          style={{ width: `${pct}%`, boxShadow: shadow }}
        />
      </div>
      {showPct && <span className="text-xs text-mute font-mono tabular w-9 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}

export function Ring({
  value, size = 260, stroke = 10, paused = false, children,
}: { value: number; size?: number; stroke?: number; paused?: boolean; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#5E92F5" />
            <stop offset="100%" stopColor="#2A5DCE" />
          </linearGradient>
          <linearGradient id="ringGradAccent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#FFB28C" />
            <stop offset="100%" stopColor="#FF5A1F" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          className={clsx("ring-fill", paused && "ring-fill-paused")}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Heatmap({ data }: { data: number[][] }) {
  const days = ["S","T","Q","Q","S","S","D"];
  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-[3px] pt-5 text-[10px] text-mute font-mono">
        {days.map((d, i) => (
          <div key={i} className="h-[14px] leading-[14px]">{i % 2 === 0 ? d : ""}</div>
        ))}
      </div>
      <div className="flex-1">
        <div className="flex gap-[3px]">
          {data.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {wi % 4 === 0
                ? <div className="text-[10px] text-mute font-mono h-3 leading-3">{wi === 0 ? "−12s" : wi === 4 ? "−8s" : "−4s"}</div>
                : <div className="h-3" />}
              {col.map((v, di) => (
                <div
                  key={di}
                  title={`${v} sessões`}
                  className={`w-[14px] h-[14px] rounded-[3px] hm-${v} hover:ring-1 hover:ring-white/30`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2 ml-auto justify-end text-[10px] text-mute font-mono">
          menos
          {[0,1,2,3,4].map((v) => <div key={v} className={`w-[10px] h-[10px] rounded-[2px] hm-${v}`} />)}
          mais
        </div>
      </div>
    </div>
  );
}

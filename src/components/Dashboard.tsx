import { VENDORS, formatNumber } from '../lib/calc';

const STATS = [
  {
    label: 'Total Rep',
    value: formatNumber(VENDORS.reduce((a, v) => a + v.rep, 0)),
    icon: 'fas fa-trophy',
    color: 'text-accent',
    desc: 'Combined vendor reputation',
  },
  {
    label: 'Average',
    value: `${Math.round(VENDORS.reduce((a, v) => a + (v.rep / v.maxRep) * 100, 0) / VENDORS.length)}%`,
    icon: 'fas fa-chart-simple',
    color: 'text-green',
    desc: 'Mean progress across vendors',
  },
  {
    label: 'Max Possible',
    value: formatNumber(VENDORS.reduce((a, v) => a + v.maxRep, 0)),
    icon: 'fas fa-arrow-up',
    color: 'text-blue',
    desc: 'Combined max reputation',
  },
  {
    label: 'Active Vendors',
    value: String(VENDORS.length),
    icon: 'fas fa-store',
    color: 'text-accent',
    desc: 'Vendors in Gray Zone Warfare',
  },
];

function ProgressRing({ pct, size = 32 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct >= 90 ? 'var(--color-green)' : 'var(--color-accent)'}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="square"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="stat-number"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  );
}

export default function Dashboard() {
  return (
    <div className="tab-content">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <i className="fas fa-gauge text-accent text-sm" />
        <span className="section-title">Overview</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-stagger">
        {STATS.map((s) => (
          <div key={s.label} className="card card-highlight p-4 card-pulse">
            <div className="flex items-center gap-2 mb-2">
              <i className={`${s.icon} ${s.color} text-xs`} />
              <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-text-muted">{s.label}</span>
            </div>
            <div className={`text-xl font-bold font-mono ${s.color} stat-number`}>{s.value}</div>
            <div className="text-[9px] font-mono text-text-muted/50 mt-1">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-users text-accent/60 text-xs" />
        <span className="section-title">Vendor Progress</span>
      </div>

      {/* Vendor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-stagger">
        {VENDORS.map((v) => {
          const pct = Math.round((v.rep / v.maxRep) * 100);
          const group = VENDORS.filter((x) => x.maxRep === v.maxRep);
          return (
            <div key={v.slug} className="card card-highlight p-4">
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 border border-accent/20 flex items-center justify-center">
                    <ProgressRing pct={pct} size={28} />
                  </div>
                  <div>
                    <div className="text-sm font-bold font-mono text-text">{v.name}</div>
                    <div className="text-[9px] font-mono text-text-muted/60 uppercase tracking-wider">{v.desc}</div>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold ${pct >= 90 ? 'text-green' : pct >= 50 ? 'text-accent' : 'text-text-muted'}`}>
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="progress mb-1">
                <div
                  className="progress-fill amber animate"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-text-muted">
                  {formatNumber(v.rep)}
                  <span className="text-text-muted/40"> / {formatNumber(v.maxRep)}</span>
                </span>
                <span className="text-text-muted/40">
                  {group.length > 1 ? `${group.map((x) => x.name).join(', ')} — ${formatNumber(v.maxRep)}` : `Max ${formatNumber(v.maxRep)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick info */}
      <div className="mt-8 border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <i className="fas fa-circle-info text-accent/60 text-xs" />
          <span className="section-title">About This Tool</span>
        </div>
        <p className="text-xs font-mono text-text-muted/80 leading-relaxed">
          GZW Tools is a fan-made companion for <span className="text-text">Gray Zone Warfare</span>.
          Plan your reputation farming, compare ammunition penetration, browse weapons,
          and find the best armor — all in one place. Data sourced from the GZW Wiki.
        </p>
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono text-text-muted/50">
          <span>Not affiliated with M.A.G. Studios</span>
          <span>•</span>
          <span>v{import.meta.env.VITE_APP_VERSION || '1.0'}</span>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { formatNumber } from '../lib/calc';
import { getVendorReps, setVendorRep, type VendorRep } from '../lib/vendortracker';

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
  const [reps, setReps] = useState<VendorRep[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Load on mount and on focus (so other tabs can update)
  const load = () => setReps(getVendorReps());

  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);

  const totalRep = reps.reduce((a, v) => a + v.rep, 0);
  const maxTotal = reps.reduce((a, v) => a + v.maxRep, 0);
  const avgPct = reps.length > 0 ? Math.round(reps.reduce((a, v) => a + (v.rep / v.maxRep) * 100, 0) / reps.length) : 0;

  const startEdit = (slug: string, val: number) => {
    setEditing(slug);
    setEditValue(String(val));
  };

  const saveEdit = (slug: string) => {
    const val = parseInt(editValue) || 0;
    setVendorRep(slug, val);
    setEditing(null);
    load();
  };

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-6">
        <i className="fas fa-gauge text-accent text-sm" />
        <span className="section-title">Overview</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-stagger">
        {[
          { label: 'Total Rep', value: formatNumber(totalRep), icon: 'fas fa-trophy', color: 'text-accent', desc: 'Combined vendor reputation' },
          { label: 'Average', value: `${avgPct}%`, icon: 'fas fa-chart-simple', color: 'text-green', desc: 'Mean progress across vendors' },
          { label: 'Max Possible', value: formatNumber(maxTotal), icon: 'fas fa-arrow-up', color: 'text-blue', desc: 'Combined max reputation' },
          { label: 'Active Vendors', value: String(reps.length), icon: 'fas fa-store', color: 'text-accent', desc: 'Vendors in Gray Zone Warfare' },
        ].map((s) => (
          <div key={s.label} className="card card-highlight p-4">
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
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <i className="fas fa-users text-accent/60 text-xs" />
          <span className="section-title">Vendor Progress</span>
        </div>
        <span className="text-[9px] font-mono text-text-muted/40">Click rep value to edit</span>
      </div>

      {/* Vendor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-stagger">
        {reps.map((v) => {
          const pct = v.maxRep > 0 ? Math.round((v.rep / v.maxRep) * 100) : 0;
          return (
            <div key={v.slug} className="card card-highlight p-4">
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

              {/* Editable rep */}
              <div className="mb-2">
                {editing === v.slug ? (
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="input input-sm flex-1"
                      min={0}
                      max={v.maxRep}
                      autoFocus
                      aria-label={`Set ${v.name} reputation`}
                    />
                    <button onClick={() => saveEdit(v.slug)} className="btn btn-primary btn-sm px-3">
                      <i className="fas fa-check text-[10px]" />
                    </button>
                    <button onClick={() => setEditing(null)} className="btn btn-outline btn-sm px-3">
                      <i className="fas fa-xmark text-[10px]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(v.slug, v.rep)}
                    className="w-full text-left"
                  >
                    <div className="progress mb-1">
                      <div className="progress-fill amber animate" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-text-muted">
                        <span className="text-accent font-bold">{formatNumber(v.rep)}</span>
                        <span className="text-text-muted/40"> / {formatNumber(v.maxRep)}</span>
                      </span>
                      <span className="text-text-muted/40 text-[8px]">Click to edit</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => { localStorage.removeItem('gzw-vendor-reps'); load(); }}
          className="text-[9px] font-mono text-text-muted/30 hover:text-red/60 transition-colors"
        >
          Reset all vendor rep values
        </button>
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

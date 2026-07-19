import { useState, useEffect, useCallback } from 'react';
import { calcRepToDollars, formatCurrency, formatNumber, MAX_REP, VENDORS } from '../lib/calc';

interface Props {
  result: ReturnType<typeof calcRepToDollars> | null;
  setResult: (r: ReturnType<typeof calcRepToDollars>) => void;
}

const LS_KEY = 'gzw-rep-calc';

function loadSaved() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* noop */ }
  return { current: '7277', target: String(MAX_REP) };
}

export default function RepCalculator({ result, setResult }: Props) {
  const [current, setCurrent] = useState(loadSaved().current);
  const [target, setTarget] = useState(loadSaved().target);
  const [rate, setRate] = useState('100');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ current, target }));
  }, [current, target]);

  const calculate = useCallback(() => {
    const c = parseInt(current) || 0;
    const t = parseInt(target) || MAX_REP;
    const r = parseInt(rate) || 100;
    const vendor = VENDORS.find((v) => v.slug === selectedVendor);
    const maxRep = vendor?.maxRep ?? Math.max(t, MAX_REP);
    setResult(calcRepToDollars(c, t, r, maxRep));
  }, [current, target, rate, selectedVendor, setResult]);

  const pickVendor = (slug: string) => {
    const v = VENDORS.find((x) => x.slug === slug);
    if (v) { setCurrent(String(v.rep)); setTarget(String(v.maxRep)); setSelectedVendor(slug); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-bullseye text-accent text-sm" />
        <span className="section-title">Rep to Dollars</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
            <i className="fas fa-arrow-right-to-bracket text-accent/60 mr-1" />
            Current Rep
          </label>
          <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} min="0" max={MAX_REP} className="input" />
        </div>
        <div>
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
            <i className="fas fa-bullseye text-accent/60 mr-1" />
            Target Rep
          </label>
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} min="0" max={MAX_REP} className="input" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
          <i className="fas fa-dollar-sign text-accent/60 mr-1" />
          $ / Rep Point
        </label>
        <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} min="1" className="input" />
      </div>

      <div className="mb-5">
        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-2 block">
          <i className="fas fa-user text-accent/60 mr-1" />
          Vendor Quick Pick
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VENDORS.map((v) => (
            <button
              key={v.slug}
              onClick={() => pickVendor(v.slug)}
              className={`text-left px-3 py-2 text-xs font-mono border transition-colors ${
                selectedVendor === v.slug
                  ? 'border-accent/50 bg-accent/5 text-accent'
                  : 'border-border text-text-muted hover:border-text-muted/30 hover:text-text/80'
              }`}
            >
              <div className="font-bold tracking-wide">{v.name}</div>
              <div className="text-[10px] opacity-60">{formatNumber(v.rep)} → {formatNumber(v.maxRep)}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={calculate} className="btn btn-primary w-full">
        <i className="fas fa-calculator" />
        Calculate
      </button>

      {result && (
        <div className="mt-5 p-4 bg-surface-2 border border-border">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-text-muted uppercase tracking-wide font-mono">Total Required</span>
            <span className="text-2xl font-bold font-mono text-accent text-glow">
              {formatCurrency(result.cost)}
            </span>
          </div>
          <div className="divider" />
          <div className="space-y-1.5 text-xs font-mono">
            {[
              { label: 'Current Rep', value: formatNumber(result.current) },
              { label: 'Target Rep', value: formatNumber(result.target) },
              { label: 'Rep Needed', value: `+${formatNumber(result.diff)}`, accent: true },
              { label: 'Rate', value: formatCurrency(result.rate) },
              { label: 'Max Rep', value: formatNumber(result.maxRep) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <span className="text-text-muted">{r.label}</span>
                <span className={`font-medium ${r.accent ? 'text-accent' : 'text-text'}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
            <span>0</span>
            <span>{formatNumber(result.current)} / {formatNumber(result.maxRep)}</span>
          </div>
          <div className="progress">
            <div className="progress-fill amber" style={{ width: `${result.progressAfterPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

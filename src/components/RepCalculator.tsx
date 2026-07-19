import { useState, useEffect } from 'react';
import { calcRepToDollars, formatCurrency, formatNumber, MAX_REP, VENDORS } from '../lib/calc';
import StatRow from './ui/StatRow';

interface Props {
  result: ReturnType<typeof calcRepToDollars> | null;
  setResult: (r: ReturnType<typeof calcRepToDollars>) => void;
}

const LS_KEY = 'gzw-rep-calc';

function loadSaved(): { current: string; target: string } {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { current: '7277', target: String(MAX_REP) };
}

export default function RepCalculator({ result, setResult }: Props) {
  const [current, setCurrent] = useState(loadSaved().current);
  const [target, setTarget] = useState(loadSaved().target);
  const [rate, setRate] = useState('100');

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ current, target }));
  }, [current, target]);

  const calculate = () => {
    const c = parseInt(current) || 0;
    const t = parseInt(target) || MAX_REP;
    const r = parseInt(rate) || 100;
    setResult(calcRepToDollars(c, t, r));
  };

  return (
    <div>
      <p className="text-sm text-slate/70 mb-5 leading-relaxed">
        Calculate how much money you need to reach a target reputation level with a vendor.
        Every <strong className="text-amber">$100</strong> spent grants{' '}
        <strong className="text-amber">1 rep point</strong>.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <InputField label="Current Rep" value={current} onChange={setCurrent} max={MAX_REP} />
        <InputField label="Target Rep" value={target} onChange={setTarget} max={MAX_REP} />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate/50 uppercase tracking-widest mb-1.5">
          $ / Rep Point
        </label>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          min="1"
          className="w-full bg-carbon-light border border-carbon-border rounded-lg px-3 py-2.5 text-white font-mono font-medium focus:border-amber focus:outline-none transition-colors"
        />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate/50 uppercase tracking-widest mb-2">
          Quick Pick — Vendor
        </label>
        <div className="flex flex-wrap gap-2">
          {VENDORS.map((v) => (
            <button
              key={v.slug}
              onClick={() => { setCurrent(String(v.rep)); setTarget(String(MAX_REP)); }}
              className="group relative px-3 py-2 text-xs font-medium bg-carbon-light/50 border border-carbon-border rounded-lg text-slate/70 hover:border-drab hover:text-sand transition-all"
            >
              <span className="block font-semibold">{v.name}</span>
              <span className="block text-[10px] opacity-50">{formatNumber(v.rep)} rep</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full py-3 bg-drab hover:bg-drab-light text-white font-bold rounded-lg transition-all text-base tracking-wide uppercase"
      >
        Calculate
      </button>

      {result && (
        <div className="mt-5 p-4 bg-carbon-light/50 rounded-lg border border-carbon-border/50">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-carbon-border/50">
            <span className="text-sm text-slate/60">Total Required</span>
            <span className="text-2xl font-bold font-mono text-amber">
              {formatCurrency(result.cost)}
            </span>
          </div>

          <div className="space-y-2 text-sm font-mono">
            <StatRow label="Current Rep" value={formatNumber(result.current)} mono />
            <StatRow label="Target Rep" value={formatNumber(result.target)} mono />
            <StatRow label="Rep Needed" value={`+${formatNumber(result.diff)}`} highlight mono />
            <StatRow label="Rate" value={formatCurrency(result.rate)} mono />
          </div>

          <div className="mt-4 pt-4 border-t border-carbon-border/50">
            <div className="flex justify-between text-xs text-slate/50 mb-1.5">
              <span>0</span>
              <span>{formatNumber(result.current)} / {MAX_REP}</span>
            </div>
            <div className="h-2 bg-carbon-border/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-drab to-amber transition-all duration-700"
                style={{ width: `${result.progressAfterPct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, max }: { label: string; value: string; onChange: (v: string) => void; max: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate/50 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        max={max}
        className="w-full bg-carbon-light border border-carbon-border rounded-lg px-3 py-2.5 text-white font-mono font-medium focus:border-amber focus:outline-none transition-colors"
      />
    </div>
  );
}

import { useState } from 'react';
import { calcDollarsToRep, formatCurrency, formatNumber } from '../lib/calc';

const PRESETS = [50000, 100000, 250000, 500000, 1000000];

export default function DollarCalculator() {
  const [dollars, setDollars] = useState('250000');
  const [rate, setRate] = useState('100');
  const [result, setResult] = useState<{ rep: number; dollars: number; rate: number } | null>(null);

  const calculate = () => {
    const d = parseInt(dollars) || 0;
    const r = parseInt(rate) || 100;
    setResult({ rep: calcDollarsToRep(d, r), dollars: d, rate: r });
  };

  return (
    <div>
      <p className="text-sm text-slate/70 mb-5 leading-relaxed">
        See how many reputation points a specific dollar amount will get you.
      </p>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate/50 uppercase tracking-widest mb-1.5">
          Dollars to Spend
        </label>
        <input
          type="number"
          value={dollars}
          onChange={(e) => setDollars(e.target.value)}
          min="0"
          className="w-full bg-carbon-light border border-carbon-border rounded-lg px-3 py-2.5 text-white font-mono font-medium focus:border-drab focus:outline-none transition-colors"
        />
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
          className="w-full bg-carbon-light border border-carbon-border rounded-lg px-3 py-2.5 text-white font-mono font-medium focus:border-drab focus:outline-none transition-colors"
        />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate/50 uppercase tracking-widest mb-2">
          Quick Pick
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setDollars(String(p))}
              className="px-3 py-1.5 text-xs font-mono font-medium bg-carbon-light/50 border border-carbon-border rounded-lg text-slate/70 hover:border-drab hover:text-sand transition-all"
            >
              {formatCurrency(p)}
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
            <span className="text-sm text-slate/60">Rep Points Gained</span>
            <span className="text-2xl font-bold font-mono text-sand">
              {formatNumber(result.rep)}
            </span>
          </div>

          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate/50">Dollars Spent</span>
              <span className="font-medium">{formatCurrency(result.dollars)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate/50">Rate</span>
              <span className="font-medium">{formatCurrency(result.rate)} / rep</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate/50">Avg Cost Per Point</span>
              <span className="font-medium text-sand">{formatCurrency(result.dollars / result.rep)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

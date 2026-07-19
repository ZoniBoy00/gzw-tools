import { useState } from 'react';
import { calcDollarsToRep, formatCurrency, formatNumber } from '../lib/calc';

export default function DollarCalculator() {
  const [dollars, setDollars] = useState('250000');
  const [rate, setRate] = useState('100');
  const [result, setResult] = useState<{ rep: number; dollars: number; rate: number } | null>(null);

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-coins text-accent text-sm" />
        <span className="section-title">Dollars to Rep</span>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
          <i className="fas fa-dollar-sign text-accent/60 mr-1" />Dollars to Spend
        </label>
        <input
          type="number"
          value={dollars}
          onChange={(e) => setDollars(e.target.value)}
          min="0"
          className="input"
          aria-label="Dollars to spend"
        />
      </div>
      <div className="mb-4">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
          <i className="fas fa-percentage text-accent/60 mr-1" />$ / Rep Point
        </label>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          min="1"
          className="input"
          aria-label="Dollars per rep point"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {[50000, 100000, 250000, 500000, 1000000].map((p) => (
          <button
            key={p}
            onClick={() => setDollars(String(p))}
            className={`chip chip-sm ${dollars === String(p) ? 'active' : ''}`}
          >
            {formatCurrency(p)}
          </button>
        ))}
      </div>

      <button
        onClick={() =>
          setResult({
            rep: calcDollarsToRep(parseInt(dollars) || 0, parseInt(rate) || 100),
            dollars: parseInt(dollars) || 0,
            rate: parseInt(rate) || 100,
          })
        }
        className="btn btn-primary w-full"
      >
        <i className="fas fa-calculator" /> Calculate
      </button>

      {result && (
        <div className="mt-5 p-4 bg-surface-2 border border-border">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-text-muted uppercase tracking-wide font-heading">Rep Points Gained</span>
            <span className="text-2xl font-bold font-mono text-green text-glow-green">{formatNumber(result.rep)}</span>
          </div>
          <div className="divider" />
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-text-muted">Dollars Spent</span>
              <span className="font-medium">{formatCurrency(result.dollars)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Rate</span>
              <span className="font-medium">{formatCurrency(result.rate)} / rep</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Avg Cost Per Point</span>
              <span className="font-medium text-green">{formatCurrency(Math.round(result.dollars / result.rep))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

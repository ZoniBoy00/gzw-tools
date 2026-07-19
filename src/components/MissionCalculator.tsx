import { useState } from 'react';
import { calcMissionsToGoal, formatNumber, MAX_REP, MISSION_TYPES } from '../lib/calc';

export default function MissionCalculator() {
  const [current, setCurrent] = useState('5000');
  const [target, setTarget] = useState(String(MAX_REP));
  const [missions, setMissions] = useState(MISSION_TYPES);
  const [result, setResult] = useState<ReturnType<typeof calcMissionsToGoal> | null>(null);

  const handleCalc = () =>
    setResult(calcMissionsToGoal(parseInt(current) || 0, parseInt(target) || MAX_REP, missions));

  const cur = parseInt(current) || 0;
  const tgt = parseInt(target) || MAX_REP;
  const need = Math.max(0, tgt - cur);
  const pct = Math.min((cur / tgt) * 100, 100);

  const totalMissions = result ? result.reduce((a, r) => a + r.count, 0) : 0;
  const totalRep = result ? result.reduce((a, r) => a + r.count * r.repEach, 0) : 0;

  return (
    <div className="tab-content">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-clipboard-list text-accent text-sm" />
        <span className="section-title">Mission Planner</span>
      </div>

      {/* Input section */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
            <i className="fas fa-arrow-right-to-bracket text-accent/60 mr-1" />
            Current Rep
          </label>
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            min="0"
            className="input"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
            <i className="fas fa-bullseye text-accent/60 mr-1" />
            Target Rep
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            min="0"
            className="input"
          />
        </div>
      </div>

      {/* Progress to goal bar */}
      <div className="card card-highlight p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <i className="fas fa-chart-line text-accent/60 text-[10px]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted">
              Progress to Goal
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            {formatNumber(cur)} → {formatNumber(tgt)}
          </span>
        </div>
        <div className="progress mb-1">
          <div className="progress-fill amber animate" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono">
          {need > 0 ? (
            <span className="text-text-muted">
              <span className="text-accent font-bold">{formatNumber(need)}</span> rep needed to reach goal
            </span>
          ) : (
            <span className="text-green font-bold">✓ Goal already reached!</span>
          )}
          <span className="text-text-muted">{Math.round(pct)}%</span>
        </div>
      </div>

      {/* Mission types */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted">
            <i className="fas fa-list text-accent/60 mr-1" />
            Mission Types
          </span>
          <button
            onClick={() => setMissions((p) => [...p, { name: 'Custom', rep: 50 }])}
            className="text-[10px] font-mono text-accent/70 hover:text-accent tracking-wide uppercase flex items-center gap-1"
          >
            <i className="fas fa-plus text-[8px]" />
            Add
          </button>
        </div>
        <div className="space-y-1">
          {missions.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={m.name}
                onChange={(e) =>
                  setMissions((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
                className="input flex-1 input-sm"
              />
              <input
                type="number"
                value={m.rep}
                onChange={(e) =>
                  setMissions((p) =>
                    p.map((x, j) => (j === i ? { ...x, rep: parseInt(e.target.value) || 0 } : x))
                  )
                }
                min="1"
                className="input w-20 input-sm text-right"
              />
              <span className="text-[10px] text-text-muted font-mono w-8 shrink-0">rep</span>
              {missions.length > 1 && (
                <button
                  onClick={() => setMissions((p) => p.filter((_, j) => j !== i))}
                  className="text-text-muted hover:text-red text-sm px-1 shrink-0"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calculate button */}
      <button onClick={handleCalc} className="btn btn-primary w-full">
        <i className="fas fa-calculator" /> Calculate
      </button>

      {/* Results */}
      {result && result.length > 0 && (
        <div className="mt-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4 animate-stagger">
            <div className="card card-highlight p-3 text-center">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-[0.12em] mb-1">
                <i className="fas fa-shield-halved text-accent/60 mr-1" />
                Missions
              </div>
              <div className="text-xl font-bold font-mono text-accent stat-number">
                {formatNumber(totalMissions)}
              </div>
            </div>
            <div className="card card-highlight p-3 text-center">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-[0.12em] mb-1">
                <i className="fas fa-trophy text-green/60 mr-1" />
                Total Rep
              </div>
              <div className="text-xl font-bold font-mono text-green stat-number">
                {formatNumber(totalRep)}
              </div>
            </div>
            <div className="card card-highlight p-3 text-center">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-[0.12em] mb-1">
                <i className="fas fa-bullseye text-accent/60 mr-1" />
                Gap
              </div>
              <div className="text-xl font-bold font-mono text-accent/80 stat-number">
                {formatNumber(need)}
              </div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="border border-border">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-0 text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-text-muted bg-surface-2 px-3 py-2">
              <span className="col-span-6">Mission Type</span>
              <span className="col-span-3 text-right">Count</span>
              <span className="col-span-3 text-right">Total Rep</span>
            </div>
            {/* Table rows */}
            <div className="divide-y divide-border/50">
              {result.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-0 px-3 py-2.5 text-xs font-mono hover:bg-surface-2/40 transition-colors"
                >
                  <div className="col-span-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent/40" />
                    <span className="text-text">{r.type}</span>
                    <span className="text-text-muted/50">({formatNumber(r.repEach)} ea)</span>
                  </div>
                  <div className="col-span-3 text-right font-bold text-accent">{formatNumber(r.count)}</div>
                  <div className="col-span-3 text-right text-text-muted">{formatNumber(r.count * r.repEach)}</div>
                </div>
              ))}
            </div>
            {/* Table footer */}
            <div className="grid grid-cols-12 gap-0 px-3 py-2.5 text-xs font-mono bg-surface-2/60 border-t border-border">
              <span className="col-span-6 text-text-muted font-bold">Total</span>
              <span className="col-span-3 text-right font-bold text-accent">{formatNumber(totalMissions)}</span>
              <span className="col-span-3 text-right font-bold text-text">{formatNumber(totalRep)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

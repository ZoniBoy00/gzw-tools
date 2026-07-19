import { useState } from 'react';
import { calcMissionsToGoal, formatNumber, MAX_REP, MISSION_TYPES } from '../lib/calc';

export default function MissionCalculator() {
  const [current, setCurrent] = useState('5000');
  const [target, setTarget] = useState(String(MAX_REP));
  const [missions, setMissions] = useState(MISSION_TYPES);
  const [result, setResult] = useState<ReturnType<typeof calcMissionsToGoal> | null>(null);

  const handleCalc = () => setResult(calcMissionsToGoal(parseInt(current) || 0, parseInt(target) || MAX_REP, missions));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-clipboard-list text-accent text-sm" />
        <span className="section-title">Mission Planner</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block"><i className="fas fa-arrow-right-to-bracket text-accent/60 mr-1" />Current Rep</label>
          <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} className="input" />
        </div>
        <div>
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5 block"><i className="fas fa-bullseye text-accent/60 mr-1" />Target Rep</label>
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="input" />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-text-muted"><i className="fas fa-list text-accent/60 mr-1" />Mission Types</label>
          <button onClick={() => setMissions((p) => [...p, { name: 'Custom', rep: 50 }])} className="text-[10px] font-mono text-accent/70 hover:text-accent tracking-wide uppercase">
            <i className="fas fa-plus mr-1" />Add
          </button>
        </div>
        <div className="space-y-1.5">
          {missions.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={m.name} onChange={(e) => setMissions((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="input flex-1 input-sm" />
              <input type="number" value={m.rep} onChange={(e) => setMissions((p) => p.map((x, j) => j === i ? { ...x, rep: parseInt(e.target.value) || 0 } : x))} min="1" className="input w-20 input-sm text-right" />
              {missions.length > 1 && (
                <button onClick={() => setMissions((p) => p.filter((_, j) => j !== i))} className="text-text-muted hover:text-red text-sm px-1"><i className="fas fa-times" /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleCalc} className="btn btn-primary w-full"><i className="fas fa-calculator" /> Calculate</button>

      {result && result.length > 0 && (
        <div className="mt-5 p-4 bg-surface-2 border border-border">
          <div className="text-xs text-text-muted mb-3">
            Need <span className="text-text font-bold">{formatNumber(Math.max(0, (parseInt(target) || MAX_REP) - (parseInt(current) || 0)))}</span> rep total
          </div>
          <div className="space-y-1.5">
            {result.map((r, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 border border-border/50">
                <div><div className="text-sm font-medium">{r.type}</div><div className="text-[10px] text-text-muted font-mono">{formatNumber(r.repEach)} rep each</div></div>
                <div className="text-right"><div className="text-lg font-bold font-mono text-accent">{formatNumber(r.count)}</div><div className="text-[10px] text-text-muted font-mono">× {formatNumber(r.repEach)} = {formatNumber(r.count * r.repEach)}</div></div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="flex justify-between text-xs font-mono"><span className="text-text-muted">Total Missions</span><span className="font-bold text-accent">{formatNumber(result.reduce((a, r) => a + r.count, 0))}</span></div>
          <div className="flex justify-between text-xs font-mono mt-1"><span className="text-text-muted">Total Rep</span><span className="font-bold">{formatNumber(result.reduce((a, r) => a + r.count * r.repEach, 0))}</span></div>
        </div>
      )}
    </div>
  );
}

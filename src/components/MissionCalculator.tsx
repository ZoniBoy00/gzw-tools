import { useState } from 'react';
import { calcMissionsToGoal, formatNumber, MAX_REP, MISSION_TYPES } from '../lib/calc';

export default function MissionCalculator() {
  const [current, setCurrent] = useState('5000');
  const [target, setTarget] = useState(String(MAX_REP));
  const [missions, setMissions] = useState(MISSION_TYPES);
  const [result, setResult] = useState<ReturnType<typeof calcMissionsToGoal> | null>(null);

  const calculate = () => {
    const c = parseInt(current) || 0;
    const t = parseInt(target) || MAX_REP;
    setResult(calcMissionsToGoal(c, t, missions));
  };

  const updateMission = (index: number, field: 'name' | 'rep', value: string) => {
    setMissions((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, [field]: field === 'rep' ? parseInt(value) || 0 : value } : m
      )
    );
  };

  const addMission = () => {
    setMissions((prev) => [...prev, { name: 'Custom Mission', rep: 50 }]);
  };

  const removeMission = (index: number) => {
    setMissions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <p className="text-sm text-slate/70 mb-5 leading-relaxed">
        Plan how many missions of each type you need to complete to reach your rep goal.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate/50 uppercase tracking-widest mb-1.5">
            Current Rep
          </label>
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            min="0"
            className="w-full bg-carbon-light border border-carbon-border rounded-lg px-3 py-2.5 text-white font-mono font-medium focus:border-amber focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate/50 uppercase tracking-widest mb-1.5">
            Target Rep
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            min="0"
            className="w-full bg-carbon-light border border-carbon-border rounded-lg px-3 py-2.5 text-white font-mono font-medium focus:border-amber focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate/50 uppercase tracking-widest">
            Mission Types
          </label>
          <button
            onClick={addMission}
            className="text-xs text-drab-light hover:text-amber transition-colors"
          >
            + Add Type
          </button>
        </div>

        <div className="space-y-2">
          {missions.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={m.name}
                onChange={(e) => updateMission(i, 'name', e.target.value)}
                className="flex-1 bg-carbon-light border border-carbon-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-amber focus:outline-none transition-colors"
              />
              <div className="relative w-24">
                <input
                  type="number"
                  value={m.rep}
                  onChange={(e) => updateMission(i, 'rep', e.target.value)}
                  min="1"
                  className="w-full bg-carbon-light border border-carbon-border rounded-lg px-3 py-2 text-sm text-white text-right font-mono focus:border-amber focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate/50 pointer-events-none">
                  rep
                </span>
              </div>
              {missions.length > 1 && (
                <button
                  onClick={() => removeMission(i)}
                  className="text-slate/40 hover:text-danger transition-colors text-lg leading-none px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full py-3 bg-og-light hover:bg-og-lighter text-white font-bold rounded-lg transition-all text-base tracking-wide uppercase"
      >
        Calculate
      </button>

      {result && result.length > 0 && (
        <div className="mt-5 p-4 bg-carbon-light/50 rounded-lg border border-carbon-border/50">
          <div className="text-sm text-slate/60 mb-3">
            Need{' '}
            <span className="text-white font-bold font-mono">
              {formatNumber(Math.max(0, (parseInt(target) || MAX_REP) - (parseInt(current) || 0)))}
            </span>{' '}
            rep points total
          </div>

          <div className="space-y-2">
            {result.map((r, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2.5 px-3 bg-carbon-light/80 rounded-lg border border-carbon-border/30"
              >
                <div>
                  <div className="text-sm font-medium">{r.type}</div>
                  <div className="text-[11px] text-slate/50 font-mono">
                    {formatNumber(r.repEach)} rep each
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-sand">{formatNumber(r.count)}</div>
                  <div className="text-[11px] text-slate/50 font-mono">
                    × {formatNumber(r.repEach)} = {formatNumber(r.count * r.repEach)} rep
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-carbon-border/50 space-y-1">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-slate/50">Total Missions</span>
              <span className="font-bold text-sand">
                {formatNumber(result.reduce((a, r) => a + r.count, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-slate/50">Total Rep</span>
              <span className="font-bold">
                {formatNumber(result.reduce((a, r) => a + r.count * r.repEach, 0))}
              </span>
            </div>
          </div>

          {/* Visual bar showing mission mix */}
          <div className="mt-3 h-1.5 bg-carbon-border/30 rounded-full overflow-hidden flex">
            {(() => {
              const total = result.reduce((a, r) => a + r.count, 0);
              return result.map((r, i) => {
                const pct = (r.count / total) * 100;
                const colors = ['bg-amber', 'bg-drab', 'bg-sand', 'bg-og-lighter', 'bg-crimson', 'bg-steel'];
                return (
                  <div
                    key={i}
                    className={`h-full ${colors[i % colors.length]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

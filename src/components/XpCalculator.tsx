import { useEffect, useMemo, useState } from 'react';
import { fetchExperienceActions, fetchExperienceLevels, wikiUrl } from '../lib/api';
import type { ExperienceAction, ExperienceLevel } from '../lib/api';
import { clampLevel, computeXpProgress, repeatsNeeded, rewardsBetween } from '../lib/experience';

const STORAGE_KEY = 'gzw-xp-calculator';

interface SavedXp {
  current: number;
  progress: number;
  target: number;
}

function readSaved(): Partial<SavedXp> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Partial<SavedXp>) : {};
  } catch {
    return {};
  }
}

function writeSaved(value: SavedXp) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* The calculator still works without storage. */ }
}

function Calculator({ levels, actions }: { levels: ExperienceLevel[]; actions: ExperienceAction[] }) {
  const maxLevel = levels[levels.length - 1].level;
  const [saved] = useState(readSaved);
  const [current, setCurrent] = useState(() => clampLevel(levels, Number(saved.current) || 1));
  const [progress, setProgress] = useState(() => Math.max(0, Number(saved.progress) || 0));
  const [target, setTarget] = useState(() => Math.max(clampLevel(levels, Number(saved.target) || maxLevel), clampLevel(levels, Number(saved.current) || 1)));

  useEffect(() => { writeSaved({ current, progress, target }); }, [current, progress, target]);

  const result = useMemo(() => computeXpProgress(levels, current, progress, target), [levels, current, progress, target]);
  const rewards = useMemo(() => rewardsBetween(levels, current, target), [levels, current, target]);
  const repeats = useMemo(() => (result ? repeatsNeeded(result.remaining, actions) : []), [result, actions]);
  const levelOptions = levels.map(entry => entry.level);

  const changeCurrent = (value: number) => {
    setCurrent(value);
    setProgress(0);
    if (target < value) setTarget(value);
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[320px_1fr]">
      <section className="card h-fit p-3 flex flex-col gap-3" aria-label="Experience inputs">
        <label className="flex flex-col gap-1 text-[10px] text-text-muted">
          Current level
          <select className="input input-sm" value={current} onChange={event => changeCurrent(Number(event.target.value))}>
            {levelOptions.map(level => <option key={level} value={level}>Level {level}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] text-text-muted">
          XP already earned towards level {Math.min(current + 1, maxLevel)}
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="input input-sm"
            value={progress}
            disabled={current >= maxLevel}
            onChange={event => setProgress(Math.max(0, Number(event.target.value) || 0))}
          />
          {result?.nextLevelCost != null && <span className="font-mono text-[9px]">Level {current} → {current + 1} needs {result.nextLevelCost.toLocaleString('en-US')} XP</span>}
        </label>
        <label className="flex flex-col gap-1 text-[10px] text-text-muted">
          Target level
          <select className="input input-sm" value={target} onChange={event => setTarget(Math.max(Number(event.target.value), current))}>
            {levelOptions.filter(level => level >= current).map(level => <option key={level} value={level}>Level {level}</option>)}
          </select>
        </label>
        <div className="border-t border-border pt-3" aria-live="polite">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">XP still needed</div>
          <div className="mt-1 font-mono text-2xl font-bold text-accent">{result ? result.remaining.toLocaleString('en-US') : '–'}</div>
          {result && result.remaining > 0 && (
            <div className="mt-1 text-[10px] text-text-muted">Total XP at level {target}: {result.targetXp.toLocaleString('en-US')}</div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <section className="card p-3" aria-label="Ways to earn experience">
          <h2 className="mb-2 text-sm font-bold">How many times?</h2>
          {!result || result.remaining === 0 ? (
            <p className="text-xs text-text-muted">{result ? 'You already have enough XP for this level.' : 'Level data is not available.'}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {repeats.map(({ action, count }) => (
                <li key={action.id} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="min-w-0">
                    {action.name}
                    <span className="ml-1 font-mono text-[9px] text-text-muted">{action.experience} XP</span>
                  </span>
                  <span className="font-mono text-accent">{count.toLocaleString('en-US')}x</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[9px] text-text-muted">Per-action XP comes from the wiki. Task rewards are not listed there and are not counted.</p>
        </section>

        <section className="card p-3" aria-label="Level rewards">
          <h2 className="mb-2 text-sm font-bold">Rewards on the way</h2>
          {rewards.length === 0 ? (
            <p className="text-xs text-text-muted">No unlocks listed between these levels.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rewards.map(entry => (
                <li key={entry.level} className="text-xs">
                  <span className="mr-2 font-mono text-[10px] text-accent">Level {entry.level}</span>
                  {entry.rewards.map((name, index) => (
                    <span key={name}>
                      {index > 0 && ', '}
                      <a href={wikiUrl(name)} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">{name}</a>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function XpCalculator() {
  const [data, setData] = useState<{ levels: ExperienceLevel[]; actions: ExperienceAction[]; errors: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchExperienceLevels(), fetchExperienceActions()]).then(([levels, actions]) => {
      if (cancelled) return;
      const reason = (result: PromiseSettledResult<unknown>) => (result.status === 'rejected' ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : '');
      setData({
        levels: levels.status === 'fulfilled' ? levels.value : [],
        actions: actions.status === 'fulfilled' ? actions.value : [],
        errors: [reason(levels), reason(actions)].filter(Boolean),
      });
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="tab-content">
      <div className="mb-1 flex items-center gap-2">
        <i className="fas fa-ranking-star text-accent text-sm" aria-hidden="true" />
        <h1 className="section-title">XP Calculator</h1>
      </div>
      <p className="mb-4 text-[10px] font-mono text-text-muted">
        See how much experience a level needs, how many kills or discoveries that is, and what each level unlocks.
      </p>

      {!data ? (
        <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading experience data…</p></div>
      ) : (
        <>
          {data.errors.length > 0 && (
            <div className="mb-4 border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-text-muted" role="status">
              Some experience data could not be loaded: {data.errors.join(' · ')}
            </div>
          )}
          {data.levels.length === 0
            ? <div className="empty-state"><i className="fas fa-ranking-star" aria-hidden="true" /><p>No level data is available yet.</p></div>
            : <Calculator levels={data.levels} actions={data.actions} />}
        </>
      )}

      <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-text-muted/70">
        <i className="fas fa-database" aria-hidden="true" />
        Read-only records from GZW Data API · values come from the community wiki and may lag behind the game. Your inputs are stored only in this browser.
      </div>
    </div>
  );
}

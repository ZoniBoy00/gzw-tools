import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchDisassemblyRecipes, fetchHideoutModules, wikiUrl } from '../lib/api';
import type { DisassemblyRecipe } from '../lib/api';
import { computeUpgradeCost, formatRequirement, groupHideout, parseHideoutPlan } from '../lib/hideout';
import type { HideoutPlan, HideoutRoom } from '../lib/hideout';
import { useDataContext } from '../lib/useDataContext';

type HideoutTab = 'planner' | 'disassembly';

const PLAN_KEY = 'gzw-hideout-plan';

function ItemIcon({ name, images }: { name: string; images: Record<string, string> }) {
  const src = images[name];
  if (!src) return <span className="inline-block h-8 w-8 shrink-0 border border-border bg-surface-2" aria-hidden="true" />;
  return (
    <img crossOrigin="anonymous"
      src={src}
      alt=""
      loading="lazy"
      className="h-8 w-8 shrink-0 object-contain border border-border bg-surface-2"
      onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
    />
  );
}

function readSavedPlan(): string | null {
  try { return localStorage.getItem(PLAN_KEY); } catch { return null; }
}

function writeSavedPlan(plan: HideoutPlan) {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); } catch { /* The plan still works for this session without storage. */ }
}

function Planner({ rooms, images }: { rooms: HideoutRoom[]; images: Record<string, string> }) {
  const [plan, setPlan] = useState<HideoutPlan>(() => parseHideoutPlan(readSavedPlan(), rooms));
  const cost = useMemo(() => computeUpgradeCost(rooms, plan), [rooms, plan]);

  const update = (key: string, maxLevel: number, change: { current?: number; target?: number }) => {
    setPlan(previous => {
      const existing = previous[key] ?? { current: 0, target: 0 };
      const current = Math.min(Math.max(change.current ?? existing.current, 0), maxLevel);
      const target = Math.min(Math.max(change.target ?? existing.target, current), maxLevel);
      const next = { ...previous, [key]: { current, target } };
      writeSavedPlan(next);
      return next;
    });
  };

  const reset = () => {
    setPlan({});
    writeSavedPlan({});
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        {rooms.map(room => (
          <section key={room.room} aria-labelledby={`room-${room.room}`}>
            <h2 id={`room-${room.room}`} className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">{room.room}</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {room.modules.map(module => {
                const step = plan[module.key] ?? { current: 0, target: 0 };
                const next = module.levels.find(entry => entry.level === step.current + 1);
                return (
                  <article key={module.key} className="card p-3 flex flex-col gap-2">
                    <h3 className="text-sm font-bold leading-tight">{module.module}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1 text-[10px] text-text-muted">
                        Built level
                        <select
                          className="input input-sm"
                          value={step.current}
                          onChange={event => update(module.key, module.maxLevel, { current: Number(event.target.value) })}
                        >
                          {Array.from({ length: module.maxLevel + 1 }, (_, level) => <option key={level} value={level}>{level === 0 ? 'Not built' : `Level ${level}`}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-[10px] text-text-muted">
                        Target level
                        <select
                          className="input input-sm"
                          value={step.target}
                          onChange={event => update(module.key, module.maxLevel, { target: Number(event.target.value) })}
                        >
                          {Array.from({ length: module.maxLevel + 1 }, (_, level) => <option key={level} value={level}>{level === 0 ? 'None' : `Level ${level}`}</option>)}
                        </select>
                      </label>
                    </div>
                    <p className="text-[10px] leading-relaxed text-text-muted">
                      {next
                        ? <>Next (level {next.level}): {next.requirements.map(formatRequirement).join(', ') || 'no requirements listed'}</>
                        : step.current >= module.maxLevel ? 'Maximum level reached.' : 'No requirements listed.'}
                    </p>
                    {next?.function && <p className="font-mono text-[10px] text-accent">{next.function}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <aside className="card h-fit p-3 lg:sticky lg:top-3" aria-label="Materials needed">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Materials needed</h2>
          <button type="button" onClick={reset} className="text-[10px] text-text-muted hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent">Reset</button>
        </div>
        {cost.length === 0 ? (
          <p className="text-xs text-text-muted">Pick a built and a target level for the modules you plan to upgrade.</p>
        ) : (
          <ul className="flex flex-col gap-1.5" aria-live="polite">
            {cost.map(requirement => (
              <li key={requirement.name} className="flex items-center gap-2 text-xs">
                {requirement.name === 'Dollars'
                  ? <i className="fas fa-sack-dollar flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-surface-2 text-accent" aria-hidden="true" />
                  : <ItemIcon name={requirement.name} images={images} />}
                <span className="min-w-0 flex-1">
                  {requirement.name === 'Dollars'
                    ? 'Dollars'
                    : <a href={wikiUrl(requirement.name)} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">{requirement.name}</a>}
                </span>
                <span className="font-mono text-accent">{requirement.name === 'Dollars' ? formatRequirement(requirement) : `x${requirement.quantity}`}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Disassembly({ recipes, images, search }: { recipes: DisassemblyRecipe[]; images: Record<string, string>; search: string }) {
  const query = search.trim().toLowerCase();
  const filtered = recipes.filter(recipe => !query || `${recipe.item} ${recipe.outcome.join(' ')}`.toLowerCase().includes(query));

  if (filtered.length === 0) {
    return <div className="empty-state"><i className="fas fa-recycle" aria-hidden="true" /><p>{recipes.length ? 'No recipes match your search.' : 'No disassembly recipes are available.'}</p></div>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map(recipe => (
        <article key={recipe.id} className="card p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ItemIcon name={recipe.item} images={images} />
            <h2 className="min-w-0 flex-1 text-sm font-bold leading-tight">{recipe.item}</h2>
            {recipe.duration && <span className="tag">{recipe.duration}</span>}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Disassembles into</div>
          <ul className="flex flex-col gap-1.5">
            {recipe.outcome.map(name => (
              <li key={name} className="flex items-center gap-2 text-xs">
                <ItemIcon name={name} images={images} />
                <a href={wikiUrl(name)} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">{name}</a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export default function HideoutPlanner() {
  const { itemImages } = useDataContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: HideoutTab = searchParams.get('tab') === 'disassembly' ? 'disassembly' : 'planner';
  const search = searchParams.get('search') || '';
  const [rooms, setRooms] = useState<HideoutRoom[] | null>(null);
  const [recipes, setRecipes] = useState<DisassemblyRecipe[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchHideoutModules(), fetchDisassemblyRecipes()]).then(([modules, disassembly]) => {
      if (cancelled) return;
      const reason = (result: PromiseSettledResult<unknown>) => (result.status === 'rejected' ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : '');
      setRooms(modules.status === 'fulfilled' ? groupHideout(modules.value) : []);
      setRecipes(disassembly.status === 'fulfilled' ? disassembly.value : []);
      setErrors([reason(modules), reason(disassembly)].filter(Boolean));
    });
    return () => { cancelled = true; };
  }, []);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const loading = rooms === null || recipes === null;
  const moduleCount = rooms?.reduce((total, room) => total + room.modules.length, 0) ?? 0;

  return (
    <div className="tab-content">
      <div className="mb-1 flex items-center gap-2">
        <i className="fas fa-warehouse text-accent text-sm" aria-hidden="true" />
        <h1 className="section-title">Hideout</h1>
      </div>
      <p className="mb-4 text-[10px] font-mono text-text-muted">
        Plan module upgrades and total the materials, or look up what an item disassembles into.
      </p>

      <div className="tab-bar mb-3" role="tablist" aria-label="Hideout tools">
        <button
          id="planner-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'planner'}
          aria-controls="planner-panel"
          className={`tab ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => setParam('tab', '')}
        >
          <i className="fas fa-list-check mr-2" aria-hidden="true" />Upgrade planner <span className="ml-1 font-mono text-[9px]">{moduleCount}</span>
        </button>
        <button
          id="disassembly-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'disassembly'}
          aria-controls="disassembly-panel"
          className={`tab ${activeTab === 'disassembly' ? 'active' : ''}`}
          onClick={() => setParam('tab', 'disassembly')}
        >
          <i className="fas fa-recycle mr-2" aria-hidden="true" />Disassembly <span className="ml-1 font-mono text-[9px]">{recipes?.length ?? 0}</span>
        </button>
      </div>

      {activeTab === 'disassembly' && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[180px] flex-1">
            <span className="sr-only">Search disassembly recipes</span>
            <i className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={event => setParam('search', event.target.value)}
              placeholder="Search items or results…"
              className="input input-sm pl-8"
              aria-label="Search recipes"
            />
          </label>
        </div>
      )}

      {loading ? (
        <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading hideout data…</p></div>
      ) : (
        <>
          {errors.length > 0 && (
            <div className="mb-4 border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-text-muted" role="status">
              Some hideout data could not be loaded: {errors.join(' · ')}
            </div>
          )}
          <section id={`${activeTab}-panel`} role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
            {activeTab === 'planner'
              ? (rooms.length === 0
                ? <div className="empty-state"><i className="fas fa-warehouse" aria-hidden="true" /><p>No hideout module data is available yet.</p></div>
                : <Planner rooms={rooms} images={itemImages} />)
              : <Disassembly recipes={recipes} images={itemImages} search={search} />}
          </section>
        </>
      )}

      <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-text-muted/70">
        <i className="fas fa-database" aria-hidden="true" />
        Read-only records from GZW Data API · requirements come from the community wiki and may lag behind the game. Your plan is stored only in this browser.
      </div>
    </div>
  );
}

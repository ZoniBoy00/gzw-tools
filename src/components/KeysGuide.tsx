import { useState, useMemo } from 'react';
import keysData from '../data/keys.json';

interface KeyEntry {
  name: string;
  location: string;
  url: string;
  inTask: boolean;
}

const keys = keysData as KeyEntry[];

const LOCATIONS = [...new Set(keys.map((k) => k.location))].sort();

export default function KeysGuide() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'task' | 'loot'>('all');

  const filtered = useMemo(() => {
    let data = [...keys];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((k) => k.name.toLowerCase().includes(q) || k.location.toLowerCase().includes(q));
    }
    if (locationFilter) data = data.filter((k) => k.location === locationFilter);
    if (taskFilter === 'task') data = data.filter((k) => k.inTask);
    if (taskFilter === 'loot') data = data.filter((k) => !k.inTask);
    return data;
  }, [search, locationFilter, taskFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, KeyEntry[]> = {};
    for (const k of filtered) {
      if (!groups[k.location]) groups[k.location] = [];
      groups[k.location].push(k);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-key text-accent text-sm" />
        <span className="section-title">Keys & Keycards</span>
      </div>
      <p className="text-[10px] font-mono text-text-muted mb-4">
        {keys.length} keys across {LOCATIONS.length} locations — {keys.filter((k) => k.inTask).length} task-related
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keys..."
          className="input flex-1 min-w-[160px] input-sm"
          aria-label="Search keys"
        />
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="input w-auto input-sm" aria-label="Filter by location">
          <option value="">All Locations</option>
          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex gap-1">
          {(['all', 'task', 'loot'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTaskFilter(t)}
              className={`chip chip-sm ${taskFilter === t ? 'active' : ''}`}
            >
              {t === 'all' ? 'All' : t === 'task' ? 'Task Keys' : 'Loot Keys'}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-key" aria-hidden="true" />
          <p>No keys match your filters</p>
        </div>
      )}

      {/* Grouped by location */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([loc, locKeys]) => (
          <div key={loc}>
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-location-dot text-accent/60 text-xs" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{loc}</span>
              <span className="text-[9px] font-mono text-text-muted/50">{locKeys.length} keys</span>
            </div>
            <div className="space-y-0.5">
              {locKeys.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 border border-border hover:border-border-light transition-colors text-sm"
                >
                  <i className={`fas fa-${k.inTask ? 'fa-check-circle text-green/60' : 'fa-circle text-text-muted/30'} text-[8px]`} />
                  <span className="flex-1 min-w-0 truncate">{k.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 ${k.inTask ? 'tag tag-amber' : 'text-text-muted/40'}`}>
                    {k.inTask ? 'Task' : 'Loot'}
                  </span>
                  {k.url && (
                    <a href={k.url} target="_blank" rel="noopener noreferrer" className="text-text-muted/30 hover:text-accent transition-colors text-[10px]" title="View on Wiki">
                      <i className="fas fa-external-link-alt" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[10px] text-text-muted/60 font-mono flex items-center gap-2">
        <i className="fas fa-database" />
        {filtered.length} / {keys.length} keys
        <span className="text-accent/60">· {keys.filter((k) => k.inTask).length} task keys</span>
      </div>
    </div>
  );
}

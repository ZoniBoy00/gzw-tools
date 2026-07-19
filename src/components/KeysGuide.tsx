import { useState, useMemo } from 'react';
import keysData from '../data/keys.json';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

interface KeyEntry {
  name: string;
  location: string;
  wikiUrl: string;
  image: string;
  inTask: boolean;
}

const keys = keysData as KeyEntry[];
const LOCATIONS = [...new Set(keys.map((k) => k.location))].sort();

export default function KeysGuide() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'task' | 'loot'>('all');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

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

  const openModal = (key: KeyEntry) => {
    setModalItem({
      name: key.name,
      image: key.image || undefined,
      type: 'gear',
      fields: [
        { label: 'Location', value: key.location, desc: 'Area where this key is found or used' },
        { label: 'Type', value: key.inTask ? 'Task Key' : 'Loot Key', desc: 'Task keys have static spawn points, loot keys are random drops' },
        { label: 'Source', value: key.wikiUrl ? 'GZW Wiki' : '-', desc: 'View the wiki page for spawn locations' },
      ],
    });
  };

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {locKeys.map((k, i) => (
                <button
                  key={i}
                  onClick={() => openModal(k)}
                  className="flex items-center gap-2 px-3 py-2 border border-border hover:border-accent/30 transition-colors text-left w-full"
                >
                  {k.image && (
                    <img src={k.image} alt="" className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{k.name}</div>
                    <div className="text-[9px] font-mono text-text-muted/70 truncate">{k.location}</div>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 shrink-0 ${k.inTask ? 'tag tag-amber' : 'text-text-muted/40'}`}>
                    {k.inTask ? 'Task' : 'Loot'}
                  </span>
                  {k.wikiUrl && (
                    <a
                      href={k.wikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-muted/30 hover:text-accent transition-colors text-[10px]"
                      title="View on Wiki"
                    >
                      <i className="fas fa-external-link-alt" />
                    </a>
                  )}
                </button>
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

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

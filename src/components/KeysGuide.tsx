import { useState, useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

interface ApiKey {
  name: string;
  id?: string;
  type?: string;
  weight?: string;
  grid_size?: string;
  usage?: string;
  location?: string;
  image?: string;
  wikiUrl?: string;
  inTask?: boolean;
}

interface KeyEntry {
  name: string;
  location: string;
  image: string;
  usage: string;
  wikiUrl?: string;
}

// Known locations in the game (ordered by length so longer matches take priority)
const KNOWN_LOCATIONS = [
  'Midnight Sapphire Hotel', 'Midnight Sapphire',
  'Fort Narith', 'Tiger Bay',
  'Nakasa village', 'Nam Thaven',
  'Inthavong farm', 'Pha Lang Airfield',
  'Pha Lang', 'Blue Lagoon',
  'Fanny Paradise', 'Lamang Island',
  'Phouarun Restaurant', 'Ban Pa',
  'Sawmill', 'Hunter',
];

function extractLocation(usage: string | undefined): string {
  if (!usage) return 'Unknown';
  for (const loc of KNOWN_LOCATIONS) {
    if (usage.includes(loc)) return loc;
  }
  return 'Misc';
}

function toKeyEntry(a: ApiKey): KeyEntry {
  return {
    name: a.name,
    location: a.location || extractLocation(a.usage),
    image: a.image || '',
    usage: a.usage || '',
    wikiUrl: a.wikiUrl || `https://gray-zone-warfare.fandom.com/wiki/${encodeURIComponent(a.name)}`,
  };
}

// Filter out section-header items
function isRealKey(a: ApiKey): boolean {
  return !!a.name && !a.name.startsWith('==');
}

export default function KeysGuide() {
  const { data: apiData, loading } = useApiData<any>('keys');

  const keys: KeyEntry[] = useMemo(
    () => ((apiData || []) as ApiKey[]).filter(isRealKey).map(toKeyEntry),
    [apiData]
  );

  const LOCATIONS = useMemo(
    () => [...new Set(keys.map((k) => k.location))].sort(),
    [keys]
  );

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const filtered = useMemo(() => {
    let data = [...keys];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((k) => k.name.toLowerCase().includes(q) || k.location.toLowerCase().includes(q));
    }
    if (locationFilter) data = data.filter((k) => k.location === locationFilter);
    return data;
  }, [search, locationFilter, keys]);

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
        { label: 'Usage', value: key.usage || '-', desc: 'What this key unlocks' },
      ],
      link: key.wikiUrl ? { label: 'View on Wiki', url: key.wikiUrl } : undefined,
    });
  };

  if (loading) {
    return (
      <div className="tab-content">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-key text-accent text-sm" />
          <span className="section-title">Keys & Keycards</span>
        </div>
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>Loading keys data...</p></div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-key text-accent text-sm" />
        <span className="section-title">Keys & Keycards</span>
      </div>
      <p className="text-[10px] font-mono text-text-muted mb-4">
        {keys.length} keys across {LOCATIONS.length} locations
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
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[10px] text-text-muted/60 font-mono flex items-center gap-2">
        <i className="fas fa-database" />
        {filtered.length} / {keys.length} keys
      </div>

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

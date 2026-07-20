import { useState, useMemo } from 'react';
import { WEAPONS, WEAPON_TYPES } from '../data/weapons';
import itemImages from '../data/images.json';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

const SOURCES = [...new Set(WEAPONS.map((w) => w.source))].sort();

export default function WeaponsGuide() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const filtered = useMemo(() => {
    let data = [...WEAPONS];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((w) => w.name.toLowerCase().includes(q) || w.caliber.toLowerCase().includes(q));
    }
    if (typeFilter) data = data.filter((w) => w.type === typeFilter);
    if (sourceFilter) data = data.filter((w) => w.source === sourceFilter);
    return data;
  }, [search, typeFilter, sourceFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof WEAPONS> = {};
    for (const w of filtered) {
      const key = w.source || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    }
    return groups;
  }, [filtered]);

  const openModal = (w: (typeof WEAPONS)[number]) => {
    setModalItem({
      name: w.name,
      image: (itemImages[w.name as keyof typeof itemImages] || w.image) as string | undefined,
      type: 'weapon',
      fields: [
        { label: 'Type', value: w.type, desc: 'Weapon classification — determines handling, role and available attachments' },
        { label: 'Caliber', value: w.caliber, desc: 'The ammunition type the weapon uses — determines damage and penetration' },
        { label: 'Mag Size', value: `${w.magSize} rds`, desc: 'Number of rounds a standard magazine can hold' },
        { label: 'Fire Rate', value: w.fireRate ? `${w.fireRate} RPM` : '-', desc: 'Cyclic rate of fire — rounds per minute' },
        { label: 'Source', value: w.source, desc: 'Where to obtain this weapon' },
      ],
    });
  };

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-crosshairs text-accent text-sm" />
        <span className="section-title">Weapons Database</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search weapon or caliber..."
          className="input flex-1 min-w-[160px] input-sm"
          aria-label="Search weapons"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto input-sm" aria-label="Filter by type">
          <option value="">All Types</option>
          {WEAPON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="input w-auto input-sm" aria-label="Filter by source">
          <option value="">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-crosshairs" aria-hidden="true" />
          <p>No weapons match your filters</p>
        </div>
      )}

      {/* Grouped by source */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([source, items]) => (
          <div key={source}>
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-tag text-accent/60 text-xs" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{source}</span>
              <span className="text-[9px] font-mono text-text-muted/50">{items.length} weapon{items.length > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {items.map((w, i) => (
                <button
                  key={`${w.name}-${i}`}
                  onClick={() => openModal(w)}
                  className="flex items-center gap-2 px-3 py-2 border border-border hover:border-accent/30 transition-colors text-left w-full"
                >
                  {itemImages[w.name as keyof typeof itemImages] || w.image ? (
                    <img src={(itemImages[w.name as keyof typeof itemImages] as string) || w.image || ''} alt="" className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center bg-surface-2 border border-border shrink-0">
                      <i className="fas fa-crosshairs text-text-muted/30 text-sm" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{w.name}</div>
                    <div className="text-[9px] font-mono text-text-muted/70 truncate">
                      {w.type} · {w.caliber}
                      {w.magSize ? ` · ${w.magSize}rds` : ''}
                      {w.fireRate ? ` · ${w.fireRate}RPM` : ''}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-text-muted/40 shrink-0">{w.type}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[10px] text-text-muted/60 font-mono flex items-center gap-2">
        <i className="fas fa-database" />
        {filtered.length} / {WEAPONS.length} weapons
      </div>

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

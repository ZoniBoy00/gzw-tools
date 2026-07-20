import { useState } from 'react';
import backpacks from '../data/backpacks.json';
import itemImages from '../data/images.json';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

interface Backpack {
  name: string;
  id?: string;
  type?: string;
  weight: number;
  grid?: string;
  image?: string;
}

const SORT_OPTIONS = [
  { key: 'weight', label: 'Weight' },
  { key: 'grid', label: 'Size' },
  { key: 'name', label: 'Name' },
] as const;

function gridArea(g: string): number {
  if (!g || !g.includes('x')) return 0;
  const [w, h] = g.split('x').map(Number);
  return w * h;
}

export default function BackpackGuide() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('weight');
  const [sortAsc, setSortAsc] = useState(false);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const filtered = (backpacks as Backpack[])
    .filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sort === 'weight') cmp = a.weight - b.weight;
      else if (sort === 'grid') cmp = gridArea(a.grid || '0x0') - gridArea(b.grid || '0x0');
      else cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-bag-shopping text-accent text-sm" />
        <span className="section-title">Backpacks</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40 text-[10px]" />
          <input
            type="text"
            placeholder="Search backpacks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm pl-7"
          />
        </div>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setSort(opt.key); setSortAsc(sort === opt.key ? !sortAsc : false); }}
            className={`chip ${sort === opt.key ? 'active' : ''}`}
          >
            <i className={`fas fa-arrow-${sort === opt.key && sortAsc ? 'up' : 'down'} text-[9px]`} />
            {opt.label}
          </button>
        ))}
        <span className="text-[10px] font-mono text-text-muted/60 ml-auto">{filtered.length} backpacks</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {filtered.map((bp) => (
          <button
            key={bp.name}
            onClick={() => setModalItem({
              name: bp.name,
              image: (itemImages as Record<string, string>)[bp.name] || bp.image,
              type: 'ammo',
              fields: [
                { label: 'Weight', value: `${bp.weight} kg`, desc: 'Carry weight' },
                ...(bp.grid ? [{ label: 'Grid', value: bp.grid, desc: 'Inventory size' }] : []),
              ],
            })}
            className="card card-highlight p-3 flex flex-col items-center text-center hover:border-accent/30 transition-colors"
          >
            <div className="w-full h-24 flex items-center justify-center mb-2 bg-surface-2 border border-border overflow-hidden">
              {itemImages[bp.name as keyof typeof itemImages] || bp.image ? (
                <img
                  src={itemImages[bp.name as keyof typeof itemImages] as string || bp.image}
                  alt={bp.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <i className="fas fa-bag-shopping text-2xl text-text-muted/20" />
              )}
            </div>
            <div className="text-xs font-medium leading-tight mb-1">{bp.name}</div>
            <div className="text-[10px] font-mono text-text-muted/70 flex items-center gap-2">
              <span>{bp.weight} kg</span>
              {bp.grid && <span className="text-text-muted/40">·</span>}
              {bp.grid && <span>{bp.grid}</span>}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-bag-shopping" />
          <p>No backpacks match your search</p>
        </div>
      )}

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

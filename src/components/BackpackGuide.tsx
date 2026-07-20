import { useState, useMemo } from 'react';
import backpacks from '../data/backpacks.json';
import rigs from '../data/rigs.json';
import itemImages from '../data/images.json';
import TabBar from './ui/TabBar';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

type SubTab = 'backpacks' | 'rigs';
const SUB: { id: SubTab; label: string; icon?: string }[] = [
  { id: 'backpacks', label: 'Backpacks', icon: 'fas fa-bag-shopping' },
  { id: 'rigs', label: 'Rigs', icon: 'fas fa-vest' },
];

interface GearItem {
  name: string;
  weight: number;
  grid?: string;
  image?: string;
  id?: string;
}

const SORT_OPTIONS = [
  { key: 'weight', label: 'Weight' },
  { key: 'grid', label: 'Size' },
  { key: 'name', label: 'Name' },
] as const;

function gridArea(g: string | undefined): number {
  if (!g || !g.includes('x')) return 0;
  const [w, h] = g.split('x').map(Number);
  return w * h;
}

function GearGrid({ items, icon }: { items: GearItem[]; icon: string }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('weight');
  const [sortAsc, setSortAsc] = useState(false);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const filtered = useMemo(() => {
    let data = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((b) => b.name.toLowerCase().includes(q));
    }
    data.sort((a, b) => {
      let cmp = 0;
      if (sort === 'weight') cmp = a.weight - b.weight;
      else if (sort === 'grid') cmp = gridArea(a.grid) - gridArea(b.grid);
      else cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [items, search, sort, sortAsc]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40 text-[10px]" />
          <input
            type="text"
            placeholder="Search..."
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
        <span className="text-[10px] font-mono text-text-muted/60 ml-auto">{filtered.length} items</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {filtered.map((item) => {
          const imgSrc = itemImages[item.name as keyof typeof itemImages] as string | undefined || item.image;
          return (
            <button
              key={item.name}
              onClick={() => setModalItem({
                name: item.name,
                image: imgSrc,
                type: 'gear',
                fields: [
                  { label: 'Weight', value: `${item.weight} kg`, desc: 'Carry weight' },
                  ...(item.grid ? [{ label: 'Grid', value: item.grid, desc: 'Inventory size' }] : []),
                ],
              })}
              className="card card-highlight p-3 flex flex-col items-center text-center hover:border-accent/30 transition-colors"
            >
              <div className="w-full h-24 flex items-center justify-center mb-2 bg-surface-2 border border-border overflow-hidden">
                {imgSrc ? (
                  <img src={imgSrc} alt={item.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                ) : (
                  <i className={`fas ${icon} text-2xl text-text-muted/20`} />
                )}
              </div>
              <div className="text-xs font-medium leading-tight mb-1">{item.name}</div>
              <div className="text-[10px] font-mono text-text-muted/70 flex items-center gap-2">
                <span>{item.weight} kg</span>
                {item.grid && <span className="text-text-muted/40">·</span>}
                {item.grid && <span>{item.grid}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <i className={`fas ${icon}`} />
          <p>No items match your search</p>
        </div>
      )}

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

export default function BackpackGuide() {
  const [tab, setTab] = useState<SubTab>('backpacks');

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className={`fas ${tab === 'backpacks' ? 'fa-bag-shopping' : 'fa-vest'} text-accent text-sm`} />
        <span className="section-title">{tab === 'backpacks' ? 'Backpacks' : 'Rigs'}</span>
      </div>
      <TabBar tabs={SUB} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === 'backpacks' && <GearGrid items={backpacks as GearItem[]} icon="fa-bag-shopping" />}
        {tab === 'rigs' && <GearGrid items={(rigs as GearItem[]).filter((r) => r.weight)} icon="fa-vest" />}
      </div>
    </div>
  );
}

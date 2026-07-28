import { useState, useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';
import TabBar from './ui/TabBar';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';

type SubTab = 'backpacks' | 'rigs';
const SUB_TABS: { id: SubTab; label: string; icon?: string }[] = [
  { id: 'backpacks', label: 'Backpacks', icon: 'fas fa-backpack' },
  { id: 'rigs', label: 'Rigs', icon: 'fas fa-vest' },
];

interface BackpackEntry {
  name: string;
  type?: string;
  weight?: string;
  grid_size?: string;
  capacity?: string;
  sold_by?: string;
  image?: string;
  wikiUrl?: string;
}

interface RigEntry {
  name: string;
  type?: string;
  weight?: string;
  grid_size?: string;
  capacity?: string;
  sold_by?: string;
  image?: string;
  wikiUrl?: string;
}

type TableItem = BackpackEntry & RigEntry;

function TableSection({
  items,
  typeLabel,
  icon,
}: {
  items: TableItem[];
  typeLabel: string;
  icon: string;
}) {
  const [search, setSearch] = useState('');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const openModal = (item: TableItem) => {
    setModalItem({
      name: item.name,
      image: item.image,
      type: typeLabel === 'backpacks' ? 'backpack' : 'rig',
      fields: [
        ...(item.type ? [{ label: 'Type', value: item.type, desc: 'Item category' }] : []),
        ...(item.weight ? [{ label: 'Weight', value: item.weight, desc: 'Carry weight' }] : []),
        ...(item.grid_size ? [{ label: 'Grid Size', value: item.grid_size, desc: 'Inventory space' }] : []),
        ...(item.capacity ? [{ label: 'Capacity', value: item.capacity, desc: 'Storage capacity' }] : []),
        ...(item.sold_by ? [{ label: 'Sold By', value: item.sold_by, desc: 'Vendor' }] : []),
      ],
      link: {
        label: 'View on Wiki',
        url: item.wikiUrl || `https://gray-zone-warfare.fandom.com/wiki/${encodeURIComponent(item.name.replace(/\s+/g, '_'))}`,
      },
    });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="input flex-1 min-w-[160px] input-sm"
          aria-label="Search items"
        />
        <span className="text-[10px] font-mono text-text-muted/60 self-center ml-auto">
          {filtered.length} / {items.length} items
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <i className={`fas ${icon}`} />
          <p>No items match your search</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-text-muted text-[10px] uppercase tracking-[0.08em] border-b border-border">
                <th className="text-left py-3 px-3 font-medium w-10" />
                <th className="text-left py-3 px-3 font-medium">Name</th>
                <th className="text-left py-3 px-3 font-medium">Type</th>
                <th className="text-right py-3 px-3 font-medium">Weight</th>
                <th className="text-right py-3 px-3 font-medium">Grid Size</th>
                <th className="text-left py-3 px-3 font-medium">Source</th>
                <th className="text-center py-3 px-3 font-medium">Wiki</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.name}
                  onClick={() => openModal(item)}
                  className="border-b border-border/30 hover:bg-surface-2/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-8 h-8 object-contain" loading="lazy" />
                    ) : (
                      <i className={`fas ${icon} text-text-muted/30 text-lg w-8 h-8 flex items-center justify-center`} />
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold text-text">{item.name}</td>
                  <td className="py-3 px-3 text-text-muted">{item.type || '-'}</td>
                  <td className="py-3 px-3 text-right text-text-muted">{item.weight || '-'}</td>
                  <td className="py-3 px-3 text-right text-text-muted">{item.grid_size || '-'}</td>
                  <td className="py-3 px-3 text-text-muted">{item.sold_by || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <a
                      href={item.wikiUrl || `https://gray-zone-warfare.fandom.com/wiki/${encodeURIComponent(item.name.replace(/\s+/g, '_'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent/70 hover:text-accent transition-colors"
                      title="View on Wiki"
                    >
                      <i className="fas fa-external-link-alt text-[10px]" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

export default function BackpackGuide() {
  const [tab, setTab] = useState<SubTab>('backpacks');
  const { data: rawBp, loading: bpLoading } = useApiData<BackpackEntry>('backpacks?all=true');
  const { data: rawRigs, loading: rigLoading } = useApiData<RigEntry>('rigs?all=true');
  // Filter out category overview pages (items with only name+id, no game data)
  const backpacks = useMemo(() => (rawBp || []).filter(i => i.weight || i.grid_size || i.type || i.sold_by), [rawBp]);
  const rigs = useMemo(() => (rawRigs || []).filter(i => i.weight || i.grid_size || i.type || i.sold_by), [rawRigs]);

  const loading = bpLoading || rigLoading;

  if (loading) {
    return (
      <div className="tab-content">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-backpack text-accent text-sm" />
          <span className="section-title">Backpacks & Rigs</span>
        </div>
        <div className="empty-state">
          <i className="fas fa-spinner fa-spin" />
          <p>Loading gear data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-backpack text-accent text-sm" />
        <span className="section-title">Backpacks & Rigs</span>
      </div>
      <TabBar tabs={SUB_TABS} active={tab} onChange={setTab} />
      <p className="text-[10px] font-mono text-text-muted mt-2 mb-4">
        {tab === 'backpacks'
          ? `${(backpacks || []).length} backpacks`
          : `${(rigs || []).length} tactical rigs`}
      </p>
      <div className="mt-2">
        {tab === 'backpacks' && (
          <TableSection items={backpacks || []} typeLabel="backpacks" icon="fa-backpack" />
        )}
        {tab === 'rigs' && (
          <TableSection items={rigs || []} typeLabel="rigs" icon="fa-vest" />
        )}
      </div>
    </div>
  );
}

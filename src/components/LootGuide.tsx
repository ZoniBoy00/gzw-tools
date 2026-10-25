import { useEffect, useState } from 'react';
import { fetchLootItems, wikiUrl } from '../lib/api';
import ItemModal from './ui/ItemModal';
import type { ModalItem } from './ui/ItemModal';
import { filterLoot, formatMoney, sortLoot, toLootRow } from '../lib/loot';
import type { LootRow, LootSort } from '../lib/loot';

const SORTS: { id: LootSort; label: string }[] = [
  { id: 'perCell', label: 'Price per cell' },
  { id: 'price', label: 'Sell price' },
  { id: 'perKg', label: 'Price per kg' },
  { id: 'weight', label: 'Weight' },
  { id: 'name', label: 'Name' },
];

const MAX_ROWS = 200;

function toModal(row: LootRow): ModalItem {
  const fields = [
    { label: 'Sell Price', value: formatMoney(row.price), desc: 'Price a trader pays for this item', color: 'text-accent' },
    ...(row.perCell !== null ? [{ label: 'Price / Cell', value: formatMoney(row.perCell), desc: 'Sell price divided by inventory cells' }] : []),
    ...(row.perKg !== null ? [{ label: 'Price / kg', value: formatMoney(row.perKg), desc: 'Sell price divided by weight' }] : []),
    ...(row.size ? [{ label: 'Grid Size', value: row.size, desc: 'Inventory space' }] : []),
    ...(row.weightKg !== null ? [{ label: 'Weight', value: `${row.weightKg} kg`, desc: 'Carry weight' }] : []),
    ...(row.trader ? [{ label: 'Trader', value: row.trader, desc: 'Vendor that buys or sells it' }] : []),
  ];
  return { name: row.name, image: row.image, type: 'gear', fields, link: { label: 'View on Wiki', url: wikiUrl(row.name) } };
}

function Thumb({ src }: { src?: string }) {
  if (!src) return <span className="inline-block h-9 w-9 shrink-0 border border-border bg-surface-2" aria-hidden="true" />;
  return (
    <img crossOrigin="anonymous"
      src={src}
      alt=""
      loading="lazy"
      className="h-9 w-9 shrink-0 object-contain border border-border bg-surface-2"
      onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
    />
  );
}

export default function LootGuide() {
  const [rows, setRows] = useState<LootRow[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<LootSort>('perCell');
  const [minPrice, setMinPrice] = useState(0);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLootItems()
      .then(items => { if (!cancelled) setRows(items.map(toLootRow)); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { cancelled = true; };
  }, []);

  const priced = rows?.filter(row => row.price !== null).length ?? 0;
  const visible = rows ? sortLoot(filterLoot(rows, search, minPrice), sort) : [];
  const shown = visible.slice(0, MAX_ROWS);

  return (
    <div className="tab-content">
      <div className="mb-1 flex items-center gap-2">
        <i className="fas fa-sack-dollar text-accent text-sm" aria-hidden="true" />
        <h1 className="section-title">Loot Values</h1>
      </div>
      <p className="mb-4 text-[10px] font-mono text-text-muted">
        Find what is worth carrying out of the zone. Sort by price per inventory cell to fill your bag with the most money.
      </p>

      {error ? (
        <div className="empty-state" role="alert"><i className="fas fa-triangle-exclamation" aria-hidden="true" /><p>Could not load loot: {error}</p></div>
      ) : !rows ? (
        <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading loot…</p></div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="relative min-w-[180px] flex-1">
              <span className="sr-only">Search loot</span>
              <i className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search loot…"
                className="input input-sm pl-8"
                aria-label="Search loot"
              />
            </label>
            <select className="input input-sm w-auto" value={sort} onChange={event => setSort(event.target.value as LootSort)} aria-label="Sort by">
              {SORTS.map(entry => <option key={entry.id} value={entry.id}>Sort: {entry.label}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-[10px] text-text-muted">
              Min price
              <input
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                className="input input-sm w-24"
                value={minPrice || ''}
                placeholder="0"
                onChange={event => setMinPrice(Math.max(0, Number(event.target.value) || 0))}
              />
            </label>
            <span className="text-[9px] font-mono text-text-muted" aria-live="polite">{visible.length} / {rows.length}</span>
          </div>

          {priced === 0 && rows.length > 0 && (
            <div className="mb-4 border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-text-muted" role="status">
              The API does not have sell prices yet. They appear after the next data update.
            </div>
          )}

          {shown.length === 0 ? (
            <div className="empty-state"><i className="fas fa-box-open" aria-hidden="true" /><p>No loot matches your filters.</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {shown.map(row => (
                <button key={row.id} type="button" onClick={() => setModalItem(toModal(row))} className="card p-2 flex items-center gap-2 text-left w-full cursor-pointer hover:border-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent" aria-label={`${row.name} details`}>
                  <Thumb src={row.image} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">{row.name}</span>
                    <div className="truncate font-mono text-[9px] text-text-muted">
                      {[row.size, row.weightKg !== null ? `${row.weightKg} kg` : '', row.perKg !== null ? `${formatMoney(row.perKg)}/kg` : ''].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs font-bold text-accent">{formatMoney(row.price)}</div>
                    <div className="font-mono text-[9px] text-text-muted">{row.perCell !== null ? `${formatMoney(row.perCell)}/cell` : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {visible.length > shown.length && (
            <p className="mt-2 text-[10px] font-mono text-text-muted">Showing the first {MAX_ROWS}. Narrow the search to see more.</p>
          )}
        </>
      )}

      <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-text-muted/70">
        <i className="fas fa-database" aria-hidden="true" />
        Read-only records from GZW Data API · prices come from the community wiki and may lag behind the game.
      </div>

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

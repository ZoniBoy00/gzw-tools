import { useEffect, useMemo, useState } from 'react';
import ItemModal from './ui/ItemModal';
import { ItemExtras } from './GameItemExtras';
import { DeviceModal, QuestModal, RecipeModal } from './HideoutDetails';
import type { ModalItem } from './ui/ItemModal';
import {
  GAME_ITEM_CATEGORIES,
  amountList,
  capabilityList,
  bestSellPrice,
  cheapestOffer,
  craftTimeLabel,
  fetchGameItems,
  fetchHideoutDevices,
  fetchHideoutQuests,
  fetchHideoutRecipes,
  filterGameItems,
  formatDollars,
  formatSell,
  gameItemTitle,
  gridLabel,
  indexItemNames,
  indexItems,
  sortGameItems,
  statLabel,
  weightLabel,
} from '../lib/gameData';
import type { GameItem, GameItemSort, HideoutDevice, HideoutQuest, HideoutRecipe } from '../lib/gameData';

type Tab = 'items' | 'hideout';
const MAX_ROWS = 200;
const SORTS: { id: GameItemSort; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'price', label: 'Base price' },
  { id: 'sell', label: 'Sell price' },
  { id: 'weight', label: 'Weight' },
];
const CATEGORY_LABEL = new Map(GAME_ITEM_CATEGORIES.map(entry => [entry.id, entry.label]));
const MODAL_TYPE: Record<string, ModalItem['type']> = {
  firearms: 'weapon', ammo: 'ammo', armor: 'vest', rigs: 'rig', backpacks: 'backpack', clothing: 'gear', headgear_accessories: 'helmet',
  consumables: 'medical', grenades_explosives: 'throwable', sights: 'sight', hideout_materials: 'parts', keys: 'tool',
};

function Thumb({ src }: { src?: string }) {
  if (!src) return <span className="inline-block h-12 w-12 shrink-0 border border-border bg-surface-2" aria-hidden="true" />;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-12 w-12 shrink-0 object-contain border border-border bg-surface-2"
      onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
    />
  );
}

function toModal(item: GameItem): ModalItem {
  const weight = weightLabel(item);
  const grid = gridLabel(item);
  const best = bestSellPrice(item);
  const fields: ModalItem['fields'] = [
    { label: 'Category', value: CATEGORY_LABEL.get(item.category) ?? item.category },
    ...(item.manufacturer ? [{ label: 'Manufacturer', value: item.manufacturer }] : []),
    ...(weight ? [{ label: weight.label, value: weight.value, desc: weight.label === 'Base weight' ? 'Weight of the base part only, without attached parts, ammo or plates' : undefined }] : []),
    ...(grid ? [{ label: grid.label, value: grid.value, desc: grid.label === 'Base grid' ? 'Grid size of the base part' : undefined }] : []),
    ...(item.base_price !== undefined ? [{ label: 'Base price', value: formatDollars(item.base_price), color: 'text-accent', desc: 'Stored game value, not a vendor quote' }] : []),
    ...(best ? [{ label: 'Best sell price', value: `${formatSell(best.price)} (${best.vendors.join(', ')})` }] : []),
    ...(item.tier ? [{ label: 'Tier', value: item.tier }] : []),
    ...Object.entries(item.stats ?? {}).map(([key, value]) => ({ label: statLabel(key), value: String(value) })),
  ];
  return {
    name: gameItemTitle(item),
    image: item.image,
    type: MODAL_TYPE[item.category] ?? 'gear',
    fields,
    text: item.description ? [item.description] : undefined,
  };
}

function ItemsTab() {
  const [items, setItems] = useState<GameItem[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<GameItemSort>('name');
  const [selected, setSelected] = useState<GameItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGameItems()
      .then(value => { if (!cancelled) setItems(value); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { cancelled = true; };
  }, []);

  const names = useMemo(() => indexItemNames(items ?? []), [items]);
  const visible = useMemo(() => (items ? sortGameItems(filterGameItems(items, search, category), sort) : []), [items, search, category, sort]);
  const shown = visible.slice(0, MAX_ROWS);

  if (error) return <div className="empty-state" role="alert"><i className="fas fa-triangle-exclamation" aria-hidden="true" /><p>Could not load game data: {error}</p></div>;
  if (!items) return <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading game data…</p></div>;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[180px] flex-1">
          <span className="sr-only">Search items</span>
          <i className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-text-muted" aria-hidden="true" />
          <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search items…" className="input input-sm pl-8" aria-label="Search items" />
        </label>
        <select className="input input-sm w-auto" value={category} onChange={event => setCategory(event.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {GAME_ITEM_CATEGORIES.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select>
        <select className="input input-sm w-auto" value={sort} onChange={event => setSort(event.target.value as GameItemSort)} aria-label="Sort by">
          {SORTS.map(entry => <option key={entry.id} value={entry.id}>Sort: {entry.label}</option>)}
        </select>
        <span className="text-[11px] font-mono text-text-muted" aria-live="polite">{visible.length} / {items.length}</span>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state"><i className="fas fa-box-open" aria-hidden="true" /><p>No items match your filters.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {shown.map(item => {
            const weight = weightLabel(item);
            const grid = gridLabel(item);
            const offer = cheapestOffer(item);
            return (
              <button key={`${item.category}-${item.id}`} type="button" onClick={() => setSelected(item)} className="card p-2 flex items-center gap-2 text-left w-full cursor-pointer hover:border-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent" aria-label={`${gameItemTitle(item)} details`}>
                <Thumb src={item.image} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{gameItemTitle(item)}</span>
                  <div className="truncate font-mono text-[11px] text-text-muted">
                    {[grid?.value, weight ? `${weight.label === 'Base weight' ? 'base ' : ''}${weight.value}` : '', CATEGORY_LABEL.get(item.category), item.display_name ? item.id : ''].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs font-bold text-accent">{formatDollars(item.base_price)}</div>
                  <div className="font-mono text-[11px] text-text-muted">{offer ? `${offer.vendor} R${offer.rank}` : ''}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {visible.length > shown.length && <p className="mt-2 text-[12px] font-mono text-text-muted">Showing the first {MAX_ROWS}. Narrow the search to see more.</p>}

      {selected && (
        <ItemModal item={toModal(selected)} onClose={() => setSelected(null)} gameData={false}>
          <ItemExtras key={selected.id} item={selected} names={names} />
        </ItemModal>
      )}
    </>
  );
}

function HideoutTab() {
  const [recipes, setRecipes] = useState<HideoutRecipe[] | null>(null);
  const [devices, setDevices] = useState<HideoutDevice[] | null>(null);
  const [quests, setQuests] = useState<HideoutQuest[] | null>(null);
  const [items, setItems] = useState<GameItem[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openRecipe, setOpenRecipe] = useState<HideoutRecipe | null>(null);
  const [openDevice, setOpenDevice] = useState<HideoutDevice | null>(null);
  const [openQuest, setOpenQuest] = useState<HideoutQuest | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchHideoutRecipes(), fetchHideoutDevices(), fetchHideoutQuests()])
      .then(([r, d, q]) => { if (!cancelled) { setRecipes(r); setDevices(d); setQuests(q); } })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    // Pictures and prices of the materials; the lists work without them.
    fetchGameItems().then(value => { if (!cancelled) setItems(value); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const byId = useMemo(() => indexItems(items), [items]);

  if (error) return <div className="empty-state" role="alert"><i className="fas fa-triangle-exclamation" aria-hidden="true" /><p>Could not load hideout data: {error}</p></div>;
  if (!recipes || !devices || !quests) return <div className="empty-state" role="status"><i className="fas fa-spinner fa-spin" aria-hidden="true" /><p>Loading hideout data…</p></div>;

  const query = search.trim().toLowerCase();
  const match = (...texts: (string | null | undefined)[]) => !query || texts.some(text => text?.toLowerCase().includes(query));
  const shownRecipes = recipes.filter(r => match(r.name, r.pipeline, amountList(r.inputs), amountList(r.outputs)));
  const shownDevices = devices.filter(d => match(d.name, d.slot, amountList(d.build_materials)));
  const shownQuests = quests.filter(q => match(q.name, q.vendor));
  const cardClass = 'card p-2 text-left text-xs w-full cursor-pointer hover:border-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent';

  return (
    <>
      <label className="relative mb-3 block">
        <span className="sr-only">Search hideout</span>
        <i className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-text-muted" aria-hidden="true" />
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search recipes, devices, quests or materials…" className="input input-sm pl-8" aria-label="Search hideout" />
      </label>

      <h2 className="section-title">Crafting recipes ({shownRecipes.length})</h2>
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {shownRecipes.map(recipe => {
          const output = recipe.outputs[0] ? byId.get(recipe.outputs[0].id) : undefined;
          return (
            <button key={recipe.id} type="button" onClick={() => setOpenRecipe(recipe)} className={`${cardClass} flex items-start gap-2`} aria-label={`${recipe.name ?? recipe.id} recipe details`}>
              <Thumb src={output?.image} />
              <span className="min-w-0 flex-1">
                <span className="flex justify-between gap-2"><span className="font-bold">{recipe.name ?? recipe.id}</span><span className="font-mono text-text-muted">{recipe.pipeline}</span></span>
                <span className="mt-1 block text-text-muted">{amountList(recipe.inputs)} → <span className="text-text">{amountList(recipe.outputs)}</span></span>
                <span className="mt-1 block font-mono text-[11px] text-text-muted">
                  {craftTimeLabel(recipe.craft_time_seconds)}{recipe.known_by_default ? ' · known from start' : ''}
                  {recipe.required_capabilities ? ` · needs ${capabilityList(recipe.required_capabilities)}` : ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="section-title">Devices ({shownDevices.length})</h2>
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {shownDevices.map(device => (
          <button key={device.id} type="button" onClick={() => setOpenDevice(device)} className={cardClass} aria-label={`${device.name} device details`}>
            <span className="flex justify-between gap-2"><span className="font-bold">{device.name}</span><span className="font-mono text-text-muted">{device.slot} · L{device.level}</span></span>
            <span className="mt-1 block text-text-muted">Build: {amountList(device.build_materials)}</span>
          </button>
        ))}
      </div>

      <h2 className="section-title">Hideout quests ({shownQuests.length})</h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {shownQuests.map(quest => (
          <button key={quest.id} type="button" onClick={() => setOpenQuest(quest)} className={cardClass} aria-label={`${quest.name} quest details`}>
            <span className="flex justify-between gap-2"><span className="font-bold">{quest.name}</span><span className="font-mono text-text-muted">{quest.vendor}{quest.required_vendor_level ? ` · L${quest.required_vendor_level}` : ''}</span></span>
            {quest.briefing && <span className="mt-1 line-clamp-3 block text-text-muted">{quest.briefing}</span>}
          </button>
        ))}
      </div>

      {openRecipe && <RecipeModal recipe={openRecipe} byId={byId} onClose={() => setOpenRecipe(null)} />}
      {openDevice && <DeviceModal device={openDevice} devices={devices} byId={byId} onClose={() => setOpenDevice(null)} />}
      {openQuest && <QuestModal quest={openQuest} quests={quests} byId={byId} onClose={() => setOpenQuest(null)} />}
    </>
  );
}

export default function GameData() {
  const [tab, setTab] = useState<Tab>('items');
  return (
    <div className="tab-content">
      <div className="mb-1 flex items-center gap-2">
        <i className="fas fa-database text-accent text-sm" aria-hidden="true" />
        <h1 className="section-title">Game Data</h1>
      </div>
      <p className="mb-3 text-[12px] font-mono text-text-muted">
        Items, prices, vendors, loot sources, attachment compatibility and hideout crafting read straight from the game files (build 26256519, v0.5.0.2).
      </p>
      <div className="mb-3 flex gap-2" role="tablist" aria-label="Game data sections">
        {([['items', 'Items'], ['hideout', 'Hideout & crafting']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`btn btn-sm ${tab === id ? '' : 'btn-outline'}`}>{label}</button>
        ))}
      </div>
      {tab === 'items' ? <ItemsTab /> : <HideoutTab />}
      <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-text-muted/70">
        <i className="fas fa-database" aria-hidden="true" />
        Read-only records from GZW Data API · weights of guns, magazines, armor and rigs are for the base part only.
      </div>
    </div>
  );
}

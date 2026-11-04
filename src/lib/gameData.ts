import type { GzwDataClient } from '@zoniboy/gzw-data-client';
import { gzwClient } from './api';

/**
 * Data taken straight from the game files (`gamedata_*` datasets of the GZW Data API).
 * Weights and grids of composite items (firearms, magazines, armor, rigs, receivers, backpacks, cases, belts)
 * are for the base part only and are delivered as `base_weight` / `base_grid_size`.
 */

export interface VendorOffer { vendor: string; rank: number; price: number }
export interface SellOffer { vendors: string[]; price: number }

export interface GameItem {
  id: string;
  name: string;
  display_name?: string;
  short_name?: string;
  manufacturer?: string;
  description?: string;
  type?: string;
  tags?: string[];
  weight?: string;
  base_weight?: string;
  grid_size?: string;
  base_grid_size?: string;
  base_price?: number;
  tier?: string;
  vendors?: VendorOffer[];
  sold_by?: string;
  sell_prices?: SellOffer[];
  stats?: Record<string, string | number | boolean | null>;
  slots?: { slot: string; critical?: boolean }[];
  fits_on?: string[];
  disables_socket_types?: string[];
  image?: string;
  category: string;
}

export interface CompatSlot { slot: string; critical: boolean; welded: boolean; socket_types: string[]; accepts: string[] }
export interface CompatHost { id: string; name: string; slots: CompatSlot[] }
export interface LootSource { table: string; source: string; chance_per_roll: number }
export interface LootByItem { id: string; name: string; found_in: LootSource[]; chance_basis?: string }
export interface Amount { id: string; name: string | null; amount: number }
export interface HideoutRecipe {
  id: string;
  name: string | null;
  pipeline: string;
  craft_time_seconds: number;
  inputs: Amount[];
  outputs: Amount[];
  required_capabilities?: Record<string, number>;
  known_by_default?: boolean;
}
export interface HideoutDevice {
  id: string;
  name: string;
  description?: string | null;
  slot: string;
  level: number;
  build_materials: Amount[];
  capabilities_required?: Record<string, number>;
  capabilities_provided?: Record<string, number>;
  infrastructure_required?: Record<string, number>;
  infrastructure_provided?: Record<string, number>;
  next_upgrade?: string | null;
}
export interface QuestObjective {
  id: number;
  description: string;
  kind: string;
  sub_objectives?: QuestObjective[];
  item?: { id: string | null; name: string | null };
  amount?: number;
  room?: string;
  capability?: string;
  required_value?: number;
  recipe_name?: string;
  possible_items?: { id: string; name: string; min: number; max: number }[];
  duration_seconds?: number;
  enabled?: boolean;
}
export interface HideoutQuest {
  id: string;
  name: string;
  vendor?: string;
  required_vendor_level?: number;
  requires_quests?: string[];
  briefing?: string;
  accept_message?: string;
  debriefing?: string;
  objectives?: QuestObjective[];
  rewards?: { recipes?: { id: string; name: string }[]; items?: { id: string; name: string; count: number }[] };
}

/** Item categories in `gamedata_<category>`; the label is shown in the category filter. */
export const GAME_ITEM_CATEGORIES: { id: string; label: string }[] = [
  { id: 'ammo', label: 'Ammo' },
  { id: 'firearms', label: 'Firearms' },
  { id: 'magazines', label: 'Magazines' },
  { id: 'receivers', label: 'Receivers' },
  { id: 'barrels', label: 'Barrels' },
  { id: 'handguards', label: 'Handguards' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'pistol_grips', label: 'Pistol grips' },
  { id: 'foregrips', label: 'Foregrips' },
  { id: 'muzzle_devices', label: 'Muzzle devices' },
  { id: 'suppressors', label: 'Suppressors' },
  { id: 'sights', label: 'Sights' },
  { id: 'electronics_optics', label: 'Electronics & optics' },
  { id: 'tactical_devices', label: 'Tactical devices' },
  { id: 'mounts_adapters', label: 'Mounts & adapters' },
  { id: 'charging_handles', label: 'Charging handles' },
  { id: 'other_weapon_parts', label: 'Other weapon parts' },
  { id: 'armor', label: 'Armor' },
  { id: 'rigs', label: 'Rigs' },
  { id: 'backpacks', label: 'Backpacks' },
  { id: 'belts', label: 'Belts' },
  { id: 'containers_cases', label: 'Containers & cases' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'headgear_accessories', label: 'Headgear' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'grenades_explosives', label: 'Grenades & explosives' },
  { id: 'melee', label: 'Melee' },
  { id: 'keys', label: 'Keys' },
  { id: 'intel', label: 'Intel' },
  { id: 'hideout_materials', label: 'Hideout materials' },
  { id: 'misc', label: 'Misc' },
];

/** Concurrent dataset requests; the public API rate-limits bursts. */
const CONCURRENCY = 3;

let itemsPromise: Promise<GameItem[]> | null = null;

async function listAll<T>(client: GzwDataClient, name: string): Promise<T[]> {
  const response = await client.dataset(name).list({ all: true });
  return response.data as T[];
}

/** Load every game-file item dataset once per page load. A failed load is not cached. */
export function fetchGameItems(client: GzwDataClient = gzwClient): Promise<GameItem[]> {
  if (!itemsPromise) {
    itemsPromise = loadGameItems(client).catch(cause => { itemsPromise = null; throw cause; });
  }
  return itemsPromise;
}

async function loadGameItems(client: GzwDataClient): Promise<GameItem[]> {
  const items: GameItem[] = [];
  const queue = [...GAME_ITEM_CATEGORIES];
  let failures = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      try {
        const rows = await listAll<Omit<GameItem, 'category'>>(client, `gamedata_${next.id}`);
        for (const row of rows) items.push({ ...row, category: next.id });
      } catch {
        failures += 1;
      }
    }
  }));
  if (!items.length) throw new Error(failures ? 'Could not load game data' : 'No game data found');
  return items;
}

export const fetchCompatibilityHost = (id: string, client: GzwDataClient = gzwClient) =>
  client.dataset('gamedata_compatibility').get(id) as Promise<CompatHost | undefined>;

export const fetchLootSources = (id: string, client: GzwDataClient = gzwClient) =>
  client.dataset('gamedata_loot_by_item').get(id) as Promise<LootByItem | undefined>;

export const fetchHideoutRecipes = (client: GzwDataClient = gzwClient) => listAll<HideoutRecipe>(client, 'gamedata_hideout_recipes');
export const fetchHideoutDevices = (client: GzwDataClient = gzwClient) => listAll<HideoutDevice>(client, 'gamedata_hideout_devices');
export const fetchHideoutQuests = (client: GzwDataClient = gzwClient) => listAll<HideoutQuest>(client, 'gamedata_hideout_quests');

// ---------- pure helpers ----------

export function formatDollars(value: number | null | undefined): string {
  return value === null || value === undefined ? '–' : `$${Math.trunc(value).toLocaleString('en-US')}`;
}

/** Sell prices of cheap items (ammo, 1.2 dollars) would round to $0, so values under 10 keep their decimals. */
export function formatSell(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–';
  return value < 10 && !Number.isInteger(value) ? `$${Number(value.toFixed(2))}` : formatDollars(value);
}

/** The weight shown for an item. Composite items only have the base part's weight, which is labelled as such. */
export function weightLabel(item: GameItem): { label: string; value: string } | null {
  if (item.weight) return { label: 'Weight', value: item.weight };
  if (item.base_weight) return { label: 'Base weight', value: item.base_weight };
  return null;
}

export function gridLabel(item: GameItem): { label: string; value: string } | null {
  if (item.grid_size) return { label: 'Grid', value: item.grid_size };
  if (item.base_grid_size) return { label: 'Base grid', value: item.base_grid_size };
  return null;
}

/** Cheapest vendor offer; the game shows the integer part of the buy price. */
export function cheapestOffer(item: GameItem): VendorOffer | null {
  const offers = item.vendors ?? [];
  return offers.reduce<VendorOffer | null>((best, offer) => (!best || offer.price < best.price ? offer : best), null);
}

/** Highest price any vendor pays for the item. */
export function bestSellPrice(item: GameItem): SellOffer | null {
  const offers = item.sell_prices ?? [];
  return offers.reduce<SellOffer | null>((best, offer) => (!best || offer.price > best.price ? offer : best), null);
}

export type GameItemSort = 'name' | 'price' | 'sell' | 'weight';

function weightKg(item: GameItem): number | null {
  const match = (item.weight ?? item.base_weight)?.match(/^\s*(\d+(?:\.\d+)?)\s*kg\s*$/i);
  return match ? Number(match[1]) : null;
}

function nameKey(name: string | undefined): string {
  return (name ?? '').toLowerCase().replace(/×/g, 'x').replace(/[^a-z0-9]/g, '');
}

/**
 * Game-file record for an item name from the wiki datasets. Variants that share a display name are ambiguous;
 * the base item (no `display_name`) wins, otherwise the first one.
 */
export function findGameItem(items: GameItem[], name: string): GameItem | null {
  const key = nameKey(name);
  if (!key) return null;
  const matches = items.filter(item => !isDevItem(item) && (nameKey(item.name) === key || nameKey(item.display_name) === key));
  return matches.find(item => nameKey(item.name) === key) ?? matches[0] ?? null;
}

/** Name shown to players. Variants with equal names carry an id suffix in `name`; `display_name` is the original. */
export function gameItemTitle(item: GameItem): string {
  return item.display_name ?? item.name;
}

/** Developer test items (`<DEV> ...`) are in the game files but not obtainable. */
export function isDevItem(item: GameItem): boolean {
  return item.name.startsWith('<DEV>');
}

/** `manipulationModifier` / `fire_rate` -> `manipulation Modifier` style words for the stat list. */
export function statLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/([a-z\d])([A-Z])/g, '$1 $2');
}

export function filterGameItems(items: GameItem[], search: string, category: string): GameItem[] {
  const query = search.trim().toLowerCase();
  return items.filter(item => {
    if (isDevItem(item)) return false;
    if (category && item.category !== category) return false;
    if (!query) return true;
    return [item.name, item.display_name, item.short_name, item.manufacturer, item.id].some(text => text?.toLowerCase().includes(query));
  });
}

/** Numbers sort high-to-low with missing values last; names sort A-Z. */
export function sortGameItems(items: GameItem[], sort: GameItemSort): GameItem[] {
  const value = (item: GameItem): number | null => {
    if (sort === 'price') return item.base_price ?? null;
    if (sort === 'sell') return bestSellPrice(item)?.price ?? null;
    if (sort === 'weight') return weightKg(item);
    return null;
  };
  return [...items].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const left = value(a);
    const right = value(b);
    if (left === null && right === null) return a.name.localeCompare(b.name);
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left || a.name.localeCompare(b.name);
  });
}

/** `DA_LootTable_LootBox_A1_UnAmmo` -> `A1 UnAmmo` style label for a loot table id. */
export function lootTableLabel(table: string): string {
  return table.replace(/^DA_LootTable_/, '').replace(/_/g, ' ');
}

/** Loot sources sorted by chance, best first. Chances assume an even split inside each rule and are not verified against the game. */
export function topLootSources(record: LootByItem | undefined, limit = 12): LootSource[] {
  return [...(record?.found_in ?? [])].sort((a, b) => b.chance_per_roll - a.chance_per_roll).slice(0, limit);
}

export function formatChance(chance: number): string {
  const percent = chance * 100;
  return `${percent >= 10 ? percent.toFixed(0) : percent >= 1 ? percent.toFixed(1) : percent.toFixed(2)} %`;
}

/** Item ids mapped to names, to turn compatibility id lists into readable names. */
export function indexItemNames(items: GameItem[]): Map<string, string> {
  return new Map(items.map(item => [item.id, item.name]));
}

export interface ResolvedSlot { slot: string; critical: boolean; welded: boolean; accepts: { id: string; name: string }[] }

/** Compatibility slots with readable accept lists; ids missing from the item index keep their id as name. */
export function resolveSlots(host: CompatHost | undefined, names: Map<string, string>): ResolvedSlot[] {
  return (host?.slots ?? []).map(slot => ({
    slot: slot.slot,
    critical: slot.critical,
    welded: slot.welded,
    accepts: slot.accepts.map(id => ({ id, name: names.get(id) ?? id })).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export function craftTimeLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

export function amountList(list: Amount[]): string {
  return list.map(entry => `${entry.amount > 1 ? `${entry.amount.toLocaleString('en-US')}× ` : ''}${entry.name ?? entry.id}`).join(', ');
}

export const MONEY_ITEM_ID = 'IS_Misc_Dollars';

export function indexItems(items: GameItem[]): Map<string, GameItem> {
  return new Map(items.map(item => [item.id, item]));
}

/** Base price of a material list. Dollars count as their amount; materials without a price count as 0 and are reported. */
export function totalBasePrice(list: Amount[], byId: Map<string, GameItem>): { total: number; unpriced: number } {
  let total = 0;
  let unpriced = 0;
  for (const entry of list) {
    if (entry.id === MONEY_ITEM_ID) { total += entry.amount; continue; }
    const price = byId.get(entry.id)?.base_price;
    if (price === undefined) unpriced += 1;
    else total += price * entry.amount;
  }
  return { total, unpriced };
}

/** `heat_control` -> `Heat control` */
export function capabilityLabel(key: string): string {
  const text = statLabel(key);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function capabilityList(values: Record<string, number> | undefined): string {
  return Object.entries(values ?? {}).map(([key, value]) => `${capabilityLabel(key)} ${value}`).join(', ');
}

/** One readable line for a quest objective; objectives without a useful text (disabled timers) give an empty string. */
export function objectiveLine(objective: QuestObjective): string {
  const amount = objective.amount ?? 1;
  switch (objective.kind) {
    case 'hand_over_money': return `Hand over ${formatDollars(amount)}`;
    case 'hand_over_item': return `Hand over ${amount}× ${objective.item?.name ?? objective.description}`;
    case 'hideout_capability': return `${objective.description}: ${objective.room ?? ''} ${capabilityLabel(objective.capability ?? '')} level ${objective.required_value ?? '?'}`.replace(/\s+/g, ' ');
    case 'produce_recipe': return `Produce ${amount > 1 ? `${amount}× ` : ''}${objective.recipe_name ?? objective.description}`;
    case 'smuggling_pickup': {
      const options = (objective.possible_items ?? []).map(entry => `${entry.min === entry.max ? entry.min : `${entry.min}-${entry.max}`}× ${entry.name}`).join(' or ');
      return options ? `${objective.description} (${options})` : objective.description;
    }
    case 'time_limit': return objective.enabled ? `Time limit ${craftTimeLabel(objective.duration_seconds ?? 0)}` : '';
    default: return objective.description;
  }
}

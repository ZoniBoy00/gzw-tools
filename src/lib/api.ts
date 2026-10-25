/**
 * GZW Data API client.
 * Fetches all game data from the GZW Data API — the single source of truth.
 * Transforms API responses into the types expected by the frontend components.
 */
import { GzwDataClient, type DatasetQuery, type GzwApiRoot, type GzwStats } from '@zoniboy/gzw-data-client';
import type { ArmorClass, PenLevel, AmmoRound, ArmorVest, Helmet, WeaponEntry } from '../data/types';
import { ARMOR_CLASSES } from '../data/types';

export const GZW_API_BASE = (import.meta.env.VITE_GZW_DATA_URL || 'https://gzw-data.dev/api/v1').replace(/\/$/, '');

export function createGzwDataClient(fetchImpl?: typeof globalThis.fetch): GzwDataClient {
  return new GzwDataClient({
    baseUrl: GZW_API_BASE,
    fetch: fetchImpl ?? ((input, init) => globalThis.fetch(input, init)),
  });
}

export const gzwClient = createGzwDataClient();

async function listDataset<T>(client: GzwDataClient, name: string, query: DatasetQuery = {}): Promise<T[]> {
  const response = await client.dataset(name).list(query);
  return response.data as T[];
}

export async function fetchDataVersion(client: GzwDataClient = gzwClient): Promise<string | null> {
  const version = await client.version();
  return version.dataVersion || null;
}

export function fetchApiStats(client: GzwDataClient = gzwClient, signal?: AbortSignal): Promise<GzwStats> {
  return client.stats(signal);
}

export function fetchApiRoot(client: GzwDataClient = gzwClient, signal?: AbortSignal): Promise<GzwApiRoot> {
  return client.endpoints(signal);
}

export function wikiUrl(name: string): string {
  return `https://gray-zone-warfare.fandom.com/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`;
}

// ─── Weapons ───

interface ApiWeapon {
  name: string;
  type?: string;
  caliber?: string;
  mag_size?: string;
  fire_rate?: string;
  weight?: string;
  grid_size?: string;
  sold_by?: string;
  manufacturer?: string;
  image?: string;
}

export async function fetchWeapons(client: GzwDataClient = gzwClient): Promise<WeaponEntry[]> {
  const raw = await listDataset<ApiWeapon>(client, 'weapons');
  return raw.map(w => ({
    name: w.name,
    type: w.type || 'Unknown',
    caliber: w.caliber || 'Unknown',
    magSize: parseInt(w.mag_size || '0'),
    fireRate: w.fire_rate,
    source: w.sold_by || w.manufacturer || 'Unknown',
    image: w.image,
  }));
}

// ─── Ammo ───

interface ApiAmmo {
  name: string;
  caliber?: string;
  type?: string;
  weight?: string;
  muzzle_velocity?: string;
  accuracy_modifier?: string;
  durability_modifier?: string;
  stopped_by_armor_class?: string;
  sold_by?: string;
  manufacturer?: string;
  image?: string;
}

// Map wiki armor class strings to normalized types
const NIJ_MAP: Record<string, ArmorClass> = {
  'i': 'I', 'i+': 'I+', 
  'iia': 'IIA', 'iia+': 'IIA+',
  'ii': 'II', 'ii+': 'II+',
  'iiia': 'IIIA', 'iiia+': 'IIIA+',
  'iii': 'III', 'iii+': 'III+', 'iii++': 'III++',
  'iv': 'IV', 'iv+': 'IV+',
};

export function parsePen(stoppedBy: string | undefined): Record<ArmorClass, PenLevel> {
  const pen: Record<string, PenLevel> = {};
  for (const ac of ARMOR_CLASSES) {
    pen[ac] = 0 as PenLevel;
  }
  if (!stoppedBy) return pen as Record<ArmorClass, PenLevel>;

  const match = stoppedBy.match(/NIJ\s*([\w+]+)/i);
  if (!match) return pen as Record<ArmorClass, PenLevel>;
  if (match[1] === '0') return pen as Record<ArmorClass, PenLevel>;

  const norm = NIJ_MAP[match[1].toLowerCase()];
  const stopIndex = norm ? ARMOR_CLASSES.indexOf(norm) : -1;
  if (stopIndex < 0) return pen as Record<ArmorClass, PenLevel>;

  // `stopped_by_armor_class` is the first armor class that stops the round.
  // Classes below that threshold are penetrated, the threshold is a magdump
  // matchup, and stronger classes are ineffective. The previous implementation
  // applied the results in the opposite direction, making stronger armor look
  // easier to penetrate than weaker armor.
  ARMOR_CLASSES.forEach((ac, index) => {
    pen[ac] = (index < stopIndex ? 2 : index === stopIndex ? 1 : 0) as PenLevel;
  });

  return pen as Record<ArmorClass, PenLevel>;
}

function parseAmmoAcc(acc: string | undefined): number {
  if (!acc) return 0;
  const m = acc.match(/[+-]?\d+/);
  return m ? parseInt(m[0]) : 0;
}

// Known caliber prefixes extracted from ammo names
// Each entry: name starts with prefix → use this caliber label
const CALIBER_PREFIXES: [string, string][] = [
  ['.222 Remington', '.222 Remington'],
  ['.300 AAC Blackout', '.300 AAC Blackout'],
  ['.45 ACP', '.45 ACP'],
  ['4.6x30mm', '4.6x30mm'],
  ['5.45x39mm', '5.45x39mm'],
  ['5.56x45mm', '5.56x45mm'],
  ['7.62x25mm', '7.62x25mm'],
  ['7.62x39mm', '7.62x39mm'],
  ['7.62x51mm', '7.62x51mm'],
  ['7.62x54', '7.62x54R'],
  ['7.65mm Browning', '7.65mm Browning'],
  ['7.65 Browning', '7.65 Browning'],
  ['9x19mm', '9x19mm'],
  ['12 Gauge', '12 Gauge'],
  ['12GA', '12 Gauge'],
];

function extractCaliber(name: string): string {
  for (const [prefix, caliber] of CALIBER_PREFIXES) {
    if (name.startsWith(prefix)) return caliber;
  }
  return 'Other';
}

export async function fetchAmmo(client: GzwDataClient = gzwClient): Promise<{ rounds: AmmoRound[]; calibers: string[] }> {
  const raw = await listDataset<ApiAmmo>(client, 'ammo', { all: true });
  const rounds: AmmoRound[] = [];
  for (const a of raw) {
    if (!a.name || !a.type || a.type === 'Ammunition') continue; // skip overview pages (name+id only)
    const caliber = extractCaliber(a.name);
    rounds.push({
      name: a.name,
      caliber,
      speed: parseInt(a.muzzle_velocity || '0'),
      accMod: parseAmmoAcc(a.accuracy_modifier),
      durMod: -Math.abs(parseAmmoAcc(a.durability_modifier)),
      pen: parsePen(a.stopped_by_armor_class),
      source: a.sold_by || 'Looting',
      vendor: a.sold_by?.replace(/ R\.\d+$/, ''),
      repLevel: parseInt(a.sold_by?.match(/R\.(\d+)/)?.[1] || '0'),
    });
  }
  const calibers = [...new Set(rounds.map(r => r.caliber))].sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
  });
  return { rounds, calibers };
}

// ─── Armor ───

interface ApiArmor {
  name: string;
  type?: string;
  nij_class?: string;
  protection_rating?: string;
  material?: string;
  weight?: string;
  grid_size?: string;
  inventory?: string;
  plates?: string;
  armor_locations?: string;
  sold_by?: string;
  category?: string; // added by smart routes
  image?: string;
}

export async function fetchVests(client: GzwDataClient = gzwClient): Promise<ArmorVest[]> {
  const raw = await listDataset<ApiArmor>(client, 'vests', { all: true });
  return raw.filter(v => v.type || v.weight || v.material || v.nij_class || v.protection_rating || v.sold_by).map(mapArmor);
}

export async function fetchPlateCarriers(client: GzwDataClient = gzwClient): Promise<ArmorVest[]> {
  const raw = await listDataset<ApiArmor>(client, 'plate_carriers', { all: true });
  return raw
    .filter(v => v.name !== 'Plate Carriers' && (v.type === 'Plate Carrier' || v.protection_rating || v.nij_class || v.material || v.weight || v.sold_by))
    .map(mapArmor);
}

function mapArmor(v: ApiArmor): ArmorVest {
  return {
    name: v.name,
    nij: v.nij_class || 'N/A',
    protectionRating: v.protection_rating,
    material: v.material || 'Unknown',
    plates: v.plates || v.armor_locations || '',
    grid: v.grid_size || v.inventory || '',
    weight: parseFloat(v.weight || '0'),
    source: v.sold_by || 'Unknown',
    image: v.image,
  };
}

export async function fetchHelmets(client: GzwDataClient = gzwClient): Promise<Helmet[]> {
  const raw = await listDataset<ApiArmor>(client, 'helmets', { all: true });
  return raw.filter(h => h.type || h.weight || h.material || h.nij_class || h.sold_by).map(h => ({
    name: h.name,
    nij: h.nij_class || 'N/A',
    material: h.material || 'Unknown',
    weight: parseFloat(h.weight || '0'),
    source: h.sold_by || 'Unknown',
    image: h.image,
  }));
}

// ─── Keys ───

interface ApiKey {
  name: string;
  type?: string;
  location?: string;
  usage?: string;
  weight?: string;
  image?: string;
}

export interface KeyEntry {
  name: string;
  type: string;
  location: string;
  usage: string;
  weight: string;
  image?: string;
}

export async function fetchKeys(client: GzwDataClient = gzwClient): Promise<KeyEntry[]> {
  const raw = await listDataset<ApiKey>(client, 'keys', { all: true });
  return raw.map(k => ({
    name: k.name,
    type: k.type || 'Key',
    location: k.location || 'Unknown',
    usage: k.usage || '',
    weight: k.weight || '',
    image: k.image,
  }));
}

// ─── Images ───

interface ImageMap {
  [itemName: string]: string;
}

let imagesCache: ImageMap | null = null;

export async function fetchItemImages(client: GzwDataClient = gzwClient): Promise<ImageMap> {
  if (imagesCache) return imagesCache;
  imagesCache = await client.images();
  return imagesCache;
}

// ─── World intel ───

export interface RegionEntry {
  name: string;
  id: string;
  tier: string;
  localsType: string;
  lzCallsigns: string[];
  description: string;
  image?: string;
}

interface ApiRegion {
  name: string;
  id?: string;
  tier?: string;
  locals_type?: string;
  lz_callsign?: string;
  description?: string;
  image?: string;
}

export async function fetchRegions(client: GzwDataClient = gzwClient): Promise<RegionEntry[]> {
  const raw = await listDataset<ApiRegion>(client, 'regions', { perPage: 100 });
  return raw.map(region => ({
    name: region.name,
    id: region.id || region.name,
    tier: region.tier || '',
    localsType: region.locals_type || '',
    lzCallsigns: (region.lz_callsign || '').split(',').map(value => value.trim()).filter(Boolean),
    description: region.description || '',
    image: region.image,
  }));
}

export interface BossEntry {
  name: string;
  id: string;
  fullName: string;
  faction: string;
  location: string;
  image?: string;
  tasks: string;
}

interface ApiBoss {
  name: string;
  id?: string;
  full_name?: string;
  faction?: string;
  location?: string;
  image?: string;
  tasks?: string;
}

export async function fetchBosses(client: GzwDataClient = gzwClient): Promise<BossEntry[]> {
  const raw = await listDataset<ApiBoss>(client, 'bosses', { perPage: 100 });
  return raw.map(boss => ({
    name: boss.name,
    id: boss.id || boss.name,
    fullName: boss.full_name || '',
    faction: boss.faction || '',
    location: boss.location || '',
    image: boss.image,
    tasks: boss.tasks || '',
  }));
}



// ─── Game guide ───

export interface GuideArticle {
  id: string;
  name: string;
  content: string;
  image?: string;
}

interface ApiArticle {
  name: string;
  id?: string;
  content?: string;
  image?: string;
}

function toArticle(raw: ApiArticle): GuideArticle {
  return { id: raw.id || raw.name, name: raw.name, content: raw.content || '', image: raw.image };
}

/** Hideout plus the wiki's game-system pages (Experience, Health, Trading, ...). */
export async function fetchGuideArticles(client: GzwDataClient = gzwClient): Promise<GuideArticle[]> {
  const [hideout, systems] = await Promise.all([
    listDataset<ApiArticle>(client, 'hideout', { perPage: 100 }),
    listDataset<ApiArticle>(client, 'game_systems', { perPage: 100 }),
  ]);
  return [...hideout, ...systems].map(toArticle).filter(article => article.content.trim());
}

export async function fetchTaskGuides(client: GzwDataClient = gzwClient): Promise<GuideArticle[]> {
  const raw = await listDataset<ApiArticle>(client, 'task_guides', { perPage: 100 });
  return raw.map(toArticle).filter(article => article.content.trim());
}

export interface EvidenceItem {
  id: string;
  name: string;
  weight: string;
  gridSize: string;
  sellPrice: string;
  image?: string;
}

interface ApiEvidence {
  name: string;
  id?: string;
  weight?: string;
  grid_size?: string;
  sell_price?: string;
  image?: string;
}

export async function fetchEvidence(client: GzwDataClient = gzwClient): Promise<EvidenceItem[]> {
  const raw = await listDataset<ApiEvidence>(client, 'evidence', { perPage: 100 });
  return raw.map(item => ({
    id: item.id || item.name,
    name: item.name,
    weight: item.weight || '',
    gridSize: item.grid_size || '',
    sellPrice: item.sell_price || '',
    image: item.image,
  }));
}

// ─── Hideout ───

export interface HideoutRequirement {
  name: string;
  quantity: number;
}

export interface HideoutModuleLevel {
  id: string;
  room: string;
  module: string;
  level: number;
  requirements: HideoutRequirement[];
  function: string;
}

interface ApiHideoutModule {
  id?: string;
  name: string;
  room?: string;
  module?: string;
  level?: number;
  requirements?: { name?: string; quantity?: number }[];
  function?: string;
}

export async function fetchHideoutModules(client: GzwDataClient = gzwClient): Promise<HideoutModuleLevel[]> {
  const raw = await listDataset<ApiHideoutModule>(client, 'hideout_modules', { perPage: 200 });
  return raw
    .filter(entry => entry.module && typeof entry.level === 'number')
    .map(entry => ({
      id: entry.id || entry.name,
      room: entry.room || 'Hideout',
      module: entry.module as string,
      level: entry.level as number,
      requirements: (entry.requirements ?? [])
        .filter(requirement => requirement.name && Number(requirement.quantity) > 0)
        .map(requirement => ({ name: requirement.name as string, quantity: Number(requirement.quantity) })),
      function: entry.function || '',
    }));
}

export interface DisassemblyRecipe {
  id: string;
  item: string;
  duration: string;
  outcome: string[];
}

interface ApiDisassemblyRecipe {
  id?: string;
  name: string;
  duration?: string;
  outcome?: string[];
}

export async function fetchDisassemblyRecipes(client: GzwDataClient = gzwClient): Promise<DisassemblyRecipe[]> {
  const raw = await listDataset<ApiDisassemblyRecipe>(client, 'disassembly_recipes', { perPage: 200 });
  return raw
    .filter(entry => Array.isArray(entry.outcome) && entry.outcome.length > 0)
    .map(entry => ({
      id: entry.id || entry.name,
      item: entry.name,
      duration: entry.duration || '',
      outcome: entry.outcome as string[],
    }));
}

// ─── Loot ───

export interface LootItem {
  id: string;
  name: string;
  gridSize: string;
  weight?: string;
  weightKg?: number;
  sellPrice?: string;
  pricePerCell?: string;
  trader?: string;
  image?: string;
}

interface ApiLootItem {
  id?: string;
  name: string;
  grid_size?: string;
  weight?: string;
  sell_price?: string;
  price_per_grid_cell?: string;
  trader?: string;
  image?: string;
  numeric_values?: { weight?: { value?: number; unit?: string } };
}

export async function fetchLootItems(client: GzwDataClient = gzwClient): Promise<LootItem[]> {
  const raw = await listDataset<ApiLootItem>(client, 'loot_items', { all: true });
  return raw.map(item => {
    const weight = item.numeric_values?.weight;
    return {
      id: item.id || item.name,
      name: item.name,
      gridSize: item.grid_size || '',
      weight: item.weight,
      weightKg: weight?.unit === 'kg' && typeof weight.value === 'number' ? weight.value : undefined,
      sellPrice: item.sell_price,
      pricePerCell: item.price_per_grid_cell,
      trader: item.trader,
      image: item.image,
    };
  });
}

// ─── Vendors ───

export interface VendorProfile {
  id: string;
  name: string;
  fullName: string;
  sells: string;
  buys: string;
  image?: string;
}

interface ApiVendorProfile {
  id?: string;
  name: string;
  full_name?: string;
  sells?: string;
  buys?: string;
  image?: string;
}

export async function fetchVendorProfiles(client: GzwDataClient = gzwClient): Promise<VendorProfile[]> {
  const raw = await listDataset<ApiVendorProfile>(client, 'vendors', { perPage: 100 });
  return raw.map(vendor => ({
    id: vendor.id || vendor.name,
    name: vendor.name,
    fullName: vendor.full_name || '',
    sells: vendor.sells || '',
    buys: vendor.buys || '',
    image: vendor.image,
  }));
}

export interface VendorStockRow {
  id: string;
  item: string;
  vendor: string;
  /** Vendor rank (R.1-R.4) needed to buy the item; null when the wiki lists none. */
  rank: number | null;
  /** Source dataset, e.g. `weapon_parts`. */
  category: string;
  type?: string;
  buyPrice?: string;
}

interface ApiVendorStock {
  id?: string;
  item?: string;
  vendor?: string;
  rank?: number | null;
  category?: string;
  type?: string;
  buy_price?: string;
}

export async function fetchVendorStock(client: GzwDataClient = gzwClient): Promise<VendorStockRow[]> {
  const raw = await listDataset<ApiVendorStock>(client, 'vendor_stock', { all: true });
  return raw
    .filter(entry => entry.item && entry.vendor)
    .map(entry => ({
      id: entry.id || `${entry.vendor}-${entry.item}`,
      item: entry.item as string,
      vendor: entry.vendor as string,
      rank: typeof entry.rank === 'number' ? entry.rank : null,
      category: entry.category || 'items',
      type: entry.type,
      buyPrice: entry.buy_price,
    }));
}

// ─── Experience ───

export interface ExperienceLevel {
  id: string;
  level: number;
  /** Total experience needed to reach this level. */
  threshold: number;
  rewards: string[];
}

export interface ExperienceAction {
  id: string;
  name: string;
  category: string;
  experience: number;
}

interface ApiExperienceLevel {
  id?: string;
  name: string;
  level?: number;
  threshold?: number;
  rewards?: string[];
}

interface ApiExperienceAction {
  id?: string;
  name: string;
  category?: string;
  experience?: number;
}

export async function fetchExperienceLevels(client: GzwDataClient = gzwClient): Promise<ExperienceLevel[]> {
  const raw = await listDataset<ApiExperienceLevel>(client, 'experience_levels', { perPage: 200 });
  return raw
    .filter(entry => typeof entry.level === 'number' && typeof entry.threshold === 'number')
    .map(entry => ({
      id: entry.id || entry.name,
      level: entry.level as number,
      threshold: entry.threshold as number,
      rewards: Array.isArray(entry.rewards) ? entry.rewards : [],
    }))
    .sort((a, b) => a.level - b.level);
}

export async function fetchExperienceActions(client: GzwDataClient = gzwClient): Promise<ExperienceAction[]> {
  const raw = await listDataset<ApiExperienceAction>(client, 'experience_actions', { perPage: 200 });
  return raw
    .filter(entry => typeof entry.experience === 'number' && entry.experience > 0)
    .map(entry => ({
      id: entry.id || entry.name,
      name: entry.name,
      category: entry.category || '',
      experience: entry.experience as number,
    }));
}

/**
 * The wiki text arrives as one flat string. Split it into readable paragraphs at
 * sentence boundaries, starting a new paragraph once the current one is long enough.
 */
export function splitParagraphs(text: string, minLength = 280): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z[])/).filter(Boolean);
  const paragraphs: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    current = current ? `${current} ${sentence}` : sentence;
    if (current.length >= minLength) {
      paragraphs.push(current);
      current = '';
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

/**
 * GZW Data API client.
 * Fetches all game data from gzw-data.vercel.app — the single source of truth.
 * Transforms API responses into the types expected by the frontend components.
 */
import type { ArmorClass, PenLevel, AmmoRound, ArmorVest, Helmet, WeaponEntry } from '../data/types';
import { ARMOR_CLASSES } from '../data/types';

const BASE = 'https://gzw-data.vercel.app/api';

export function wikiUrl(name: string): string {
  return `https://gray-zone-warfare.fandom.com/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const body = await res.json();
  // gzw-data API returns { data: ..., count: ..., source: ..., timestamp: ... }
  return (body.data ?? body) as T;
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

export async function fetchWeapons(): Promise<WeaponEntry[]> {
  const raw = await fetchJson<ApiWeapon[]>(`${BASE}/weapons`);
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

function parsePen(stoppedBy: string | undefined): Record<ArmorClass, PenLevel> {
  const pen: Record<string, PenLevel> = {};
  for (const ac of ARMOR_CLASSES) {
    pen[ac] = 0 as PenLevel;
  }
  if (!stoppedBy) return pen as Record<ArmorClass, PenLevel>;
  const match = stoppedBy.match(/NIJ\s*([\w+]+)/i);
  if (match) {
    const key = match[1].toLowerCase();
    const norm = NIJ_MAP[key];
    if (norm) {
      let canPen = false;
      for (const ac of ARMOR_CLASSES) {
        if (ac === norm) canPen = true;
        pen[ac] = (canPen ? 2 : 1) as PenLevel;
      }
    }
  }
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

export async function fetchAmmo(): Promise<{ rounds: AmmoRound[]; calibers: string[] }> {
  const raw = await fetchJson<ApiAmmo[]>(`${BASE}/ammo?all=true`);
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
  material?: string;
  weight?: string;
  grid_size?: string;
  plates?: string;
  sold_by?: string;
  category?: string; // added by smart routes
  image?: string;
}

export async function fetchVests(): Promise<ArmorVest[]> {
  const raw = await fetchJson<ApiArmor[]>(`${BASE}/vests?all=true`);
  return raw.filter(v => v.type || v.weight || v.material || v.nij_class || v.sold_by).map(v => ({
    name: v.name,
    nij: v.nij_class || 'N/A',
    material: v.material || 'Unknown',
    plates: v.plates || '',
    grid: v.grid_size || '',
    weight: parseFloat(v.weight || '0'),
    source: v.sold_by || 'Unknown',
    image: v.image,
  }));
}

export async function fetchHelmets(): Promise<Helmet[]> {
  const raw = await fetchJson<ApiArmor[]>(`${BASE}/helmets?all=true`);
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

export async function fetchKeys(): Promise<KeyEntry[]> {
  const raw = await fetchJson<ApiKey[]>(`${BASE}/keys?all=true`);
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

export async function fetchItemImages(): Promise<ImageMap> {
  if (imagesCache) return imagesCache;
  imagesCache = await fetchJson<ImageMap>(`${BASE}/images`);
  return imagesCache;
}

export async function fetchVendorImages(): Promise<ImageMap> {
  return fetchItemImages(); // same endpoint
}

// ─── Misc ───

export async function fetchBackpacks() {
  return fetchJson(`${BASE}/backpacks?all=true`);
}

export async function fetchTasks() {
  return fetchJson(`${BASE}/tasks?all=true`);
}

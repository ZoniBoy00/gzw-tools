/**
 * GZW Data API client.
 * Fetches all game data from gzw-data.vercel.app — the single source of truth.
 * Transforms API responses into the types expected by the frontend components.
 */
import type { ArmorClass, PenLevel, AmmoRound, ArmorVest, Helmet, WeaponEntry } from '../data/types';

const BASE = 'https://gzw-data.vercel.app/api';

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
  'i': 'I', 'ii': 'IIA', 'iia': 'IIA', 'iia+': 'IIA+',
  'iiia': 'IIIA', 'iiia+': 'IIIA+',
  'iii': 'III', 'iii+': 'III+', 'iii++': 'III++',
  'iv': 'III++',
};

function parsePen(stoppedBy: string | undefined): Record<ArmorClass, PenLevel> {
  const pen: Record<string, PenLevel> = {};
  for (const ac of ['I', 'IIA', 'IIA+', 'IIIA', 'IIIA+', 'III', 'III+', 'III++']) {
    pen[ac] = 0 as PenLevel;
  }
  if (!stoppedBy) return pen as Record<ArmorClass, PenLevel>;
  const match = stoppedBy.match(/NIJ\s*([\w+]+)/i);
  if (match) {
    const key = match[1].toLowerCase();
    const norm = NIJ_MAP[key];
    if (norm) {
      // Can penetrate up to this class
      let canPen = false;
      for (const ac of ['I', 'IIA', 'IIA+', 'IIIA', 'IIIA+', 'III', 'III+', 'III++'] as ArmorClass[]) {
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

export async function fetchAmmo(): Promise<{ rounds: AmmoRound[]; calibers: string[] }> {
  const raw = await fetchJson<ApiAmmo[]>(`${BASE}/ammo?all=true`);
  const rounds: AmmoRound[] = [];
  for (const a of raw) {
    if (!a.name || a.type === 'Ammunition' || !a.caliber) continue; // skip overview pages
    rounds.push({
      name: a.name.replace(/^\.?\d+\s*/, ''), // strip leading caliber prefix for cleaner name
      caliber: a.caliber,
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
  nij?: string;
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
  return raw.map(v => ({
    name: v.name,
    nij: v.nij || 'N/A',
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
  return raw.map(h => ({
    name: h.name,
    nij: h.nij || 'N/A',
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

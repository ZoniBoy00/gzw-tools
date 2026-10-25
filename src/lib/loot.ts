import type { LootItem } from './api';

/**
 * Wiki prices are text such as "$5,451". A few use a dot as thousands separator ("$1.280"),
 * which is read as 1280 because no loot item is priced in cents.
 */
export function parseMoney(text: string | undefined): number | null {
  if (!text) return null;
  const digits = text.replace(/[^\d.,]/g, '');
  if (!/\d/.test(digits)) return null;
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(digits) ? digits.replace(/\./g, '') : digits.replace(/,/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Number of inventory cells in a size such as "2x3". */
export function gridCells(size: string | undefined): number | null {
  const match = size?.match(/^\s*(\d+)\s*[x×]\s*(\d+)\s*$/i);
  if (!match) return null;
  const cells = Number(match[1]) * Number(match[2]);
  return cells > 0 ? cells : null;
}

export function parseWeightKg(text: string | undefined): number | null {
  const match = text?.match(/^\s*(\d+(?:\.\d+)?)\s*kg\s*$/i);
  return match ? Number(match[1]) : null;
}

export interface LootRow {
  id: string;
  name: string;
  image?: string;
  size: string;
  weightKg: number | null;
  price: number | null;
  perCell: number | null;
  perKg: number | null;
  trader?: string;
}

export function toLootRow(item: LootItem): LootRow {
  const price = parseMoney(item.sellPrice);
  const cells = gridCells(item.gridSize);
  const weightKg = item.weightKg ?? parseWeightKg(item.weight);
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    size: item.gridSize,
    weightKg,
    price,
    // Prefer our own calculation so every priced item with a size gets a comparable number.
    perCell: price !== null && cells ? Math.round(price / cells) : parseMoney(item.pricePerCell),
    perKg: price !== null && weightKg ? Math.round(price / weightKg) : null,
    trader: item.trader,
  };
}

export type LootSort = 'perCell' | 'price' | 'perKg' | 'weight' | 'name';

/** Sort high-to-low for numbers (missing values last) and A-Z for names. */
export function sortLoot(rows: LootRow[], sort: LootSort): LootRow[] {
  const value = (row: LootRow): number | null => {
    if (sort === 'perCell') return row.perCell;
    if (sort === 'price') return row.price;
    if (sort === 'perKg') return row.perKg;
    if (sort === 'weight') return row.weightKg;
    return null;
  };
  return [...rows].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const left = value(a);
    const right = value(b);
    if (left === null && right === null) return a.name.localeCompare(b.name);
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left || a.name.localeCompare(b.name);
  });
}

export function filterLoot(rows: LootRow[], search: string, minPrice: number): LootRow[] {
  const query = search.trim().toLowerCase();
  return rows.filter(row => {
    if (query && !row.name.toLowerCase().includes(query)) return false;
    return minPrice <= 0 || (row.price !== null && row.price >= minPrice);
  });
}

export function formatMoney(value: number | null): string {
  return value === null ? '–' : `$${value.toLocaleString('en-US')}`;
}

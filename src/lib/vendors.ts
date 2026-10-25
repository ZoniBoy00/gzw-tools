import type { VendorStockRow } from './api';

/** Highest rank unlocked at a reputation value. `rankCumulative[0]` is the rep needed for R.1. */
export function rankForRep(rankCumulative: number[], rep: number): number {
  let rank = 1;
  rankCumulative.forEach((needed, index) => {
    if (rep >= needed) rank = index + 1;
  });
  return rank;
}

/** Rep still missing for the next rank, or null at the top rank. */
export function repToNextRank(rankCumulative: number[], rep: number): { rank: number; missing: number } | null {
  const next = rankCumulative.findIndex(needed => needed > rep);
  if (next < 0) return null;
  return { rank: next + 1, missing: rankCumulative[next] - rep };
}

export function categoryLabel(category: string): string {
  const text = category.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function stockCategories(rows: VendorStockRow[]): string[] {
  return [...new Set(rows.map(row => row.category))].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
}

export interface StockFilter {
  search: string;
  category: string;
  /** When set, hide items that need a higher rank than this one. */
  maxRank: number | null;
}

export function filterStock(rows: VendorStockRow[], filter: StockFilter): VendorStockRow[] {
  const query = filter.search.trim().toLowerCase();
  return rows.filter(row => {
    if (filter.category && row.category !== filter.category) return false;
    if (filter.maxRank !== null && row.rank !== null && row.rank > filter.maxRank) return false;
    if (!query) return true;
    return `${row.item} ${row.type ?? ''} ${categoryLabel(row.category)}`.toLowerCase().includes(query);
  });
}

export interface RankGroup {
  /** null = the wiki lists no rank for these items. */
  rank: number | null;
  rows: VendorStockRow[];
}

/** Group by rank (ascending, unranked last), each group sorted by item name. */
export function groupByRank(rows: VendorStockRow[]): RankGroup[] {
  const groups = new Map<number | null, VendorStockRow[]>();
  for (const row of rows) {
    const list = groups.get(row.rank) ?? [];
    list.push(row);
    groups.set(row.rank, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
    .map(([rank, list]) => ({ rank, rows: [...list].sort((a, b) => a.item.localeCompare(b.item)) }));
}

import { describe, expect, it, vi } from 'vitest';
import { categoryLabel, filterStock, groupByRank, rankForRep, repToNextRank, stockCategories } from './vendors';
import { createGzwDataClient, fetchVendorProfiles, fetchVendorStock } from './api';
import type { VendorStockRow } from './api';

const row = (item: string, rank: number | null, category: string, type?: string): VendorStockRow => ({
  id: `${category}-${item}`,
  item,
  vendor: 'Gunny',
  rank,
  category,
  type,
});

const rows = [
  row('M4', 2, 'weapons', 'Assault Rifle'),
  row('AK-74', 1, 'weapons', 'Assault Rifle'),
  row('5.56 FMJ', 1, 'ammo', 'Round'),
  row('Elite Scope', 4, 'scopes'),
  row('Odd Item', null, 'weapon_parts'),
];

describe('vendor ranks', () => {
  const thresholds = [0, 800, 9500, 13000];

  it('maps reputation to the highest unlocked rank', () => {
    expect(rankForRep(thresholds, 0)).toBe(1);
    expect(rankForRep(thresholds, 799)).toBe(1);
    expect(rankForRep(thresholds, 800)).toBe(2);
    expect(rankForRep(thresholds, 13000)).toBe(4);
    expect(rankForRep([], 500)).toBe(1);
  });

  it('reports the rep missing for the next rank and nothing at the top', () => {
    expect(repToNextRank(thresholds, 500)).toEqual({ rank: 2, missing: 300 });
    expect(repToNextRank(thresholds, 9500)).toEqual({ rank: 4, missing: 3500 });
    expect(repToNextRank(thresholds, 13000)).toBeNull();
  });
});

describe('vendor stock', () => {
  it('filters by search text, category and the rank the player has reached', () => {
    const base = { search: '', category: '', maxRank: null };

    expect(filterStock(rows, base)).toHaveLength(5);
    expect(filterStock(rows, { ...base, search: 'rifle' }).map(r => r.item).sort()).toEqual(['AK-74', 'M4']);
    expect(filterStock(rows, { ...base, category: 'ammo' }).map(r => r.item)).toEqual(['5.56 FMJ']);
    expect(filterStock(rows, { ...base, maxRank: 2 }).map(r => r.item).sort()).toEqual(['5.56 FMJ', 'AK-74', 'M4', 'Odd Item']);
    expect(filterStock(rows, { ...base, search: 'weapon parts' }).map(r => r.item)).toEqual(['Odd Item']);
  });

  it('groups by ascending rank with unranked items last, sorted by name', () => {
    const groups = groupByRank(rows);

    expect(groups.map(group => group.rank)).toEqual([1, 2, 4, null]);
    expect(groups[0].rows.map(r => r.item)).toEqual(['5.56 FMJ', 'AK-74']);
  });

  it('lists categories with readable labels', () => {
    expect(stockCategories(rows)).toEqual(['ammo', 'scopes', 'weapon_parts', 'weapons']);
    expect(categoryLabel('weapon_parts')).toBe('Weapon parts');
  });
});

describe('vendor data fetchers', () => {
  const okResponse = (data: unknown[]) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => null },
    json: async () => ({ data }),
  });

  it('maps vendor profiles and keeps missing trading info empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([
      { name: 'Gunny', id: 'gunny', full_name: 'Anton Jackson', sells: 'Weapons', buys: 'Tools', image: 'https://example.test/g.png' },
      { name: 'Vulture', id: 'vulture' },
    ]));
    const vendors = await fetchVendorProfiles(createGzwDataClient(fetchMock));

    expect(vendors[0]).toEqual({ id: 'gunny', name: 'Gunny', fullName: 'Anton Jackson', sells: 'Weapons', buys: 'Tools', image: 'https://example.test/g.png' });
    expect(vendors[1]).toMatchObject({ fullName: '', sells: '', buys: '' });
  });

  it('maps vendor stock rows and drops rows without a vendor or item', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([
      { id: 'a', item: 'M4', vendor: 'Gunny', rank: 2, category: 'weapons', type: 'Assault Rifle', buy_price: '$900' },
      { id: 'b', item: 'Bandage', vendor: 'Lab Rat', rank: null, category: 'medical' },
      { id: 'c', vendor: 'Gunny', category: 'weapons' },
    ]));
    const stock = await fetchVendorStock(createGzwDataClient(fetchMock));

    expect(stock).toEqual([
      { id: 'a', item: 'M4', vendor: 'Gunny', rank: 2, category: 'weapons', type: 'Assault Rifle', buyPrice: '$900' },
      { id: 'b', item: 'Bandage', vendor: 'Lab Rat', rank: null, category: 'medical', type: undefined, buyPrice: undefined },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/vendor_stock\?all=true$/), expect.anything());
  });
});

import { describe, expect, it, vi } from 'vitest';
import { filterLoot, formatMoney, gridCells, parseMoney, parseWeightKg, priceSourceLabel, sortLoot, toLootRow } from './loot';
import { createGzwDataClient, fetchLootItems, fetchValueItems } from './api';
import type { LootItem } from './api';

const item = (overrides: Partial<LootItem>): LootItem => ({ id: 'x', name: 'X', gridSize: '1x1', ...overrides });

describe('loot parsing', () => {
  it('reads wiki prices including the dot-thousands variant', () => {
    expect(parseMoney('$5,451')).toBe(5451);
    expect(parseMoney('$1.280')).toBe(1280);
    expect(parseMoney('$15,000')).toBe(15000);
    expect(parseMoney('$56')).toBe(56);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney(undefined)).toBeNull();
    expect(parseMoney('n/a')).toBeNull();
  });

  it('reads grid sizes and weights', () => {
    expect(gridCells('2x4')).toBe(8);
    expect(gridCells('1×2')).toBe(2);
    expect(gridCells('big')).toBeNull();
    expect(gridCells('0x3')).toBeNull();
    expect(parseWeightKg('2.100 kg')).toBe(2.1);
    expect(parseWeightKg('0.050kg')).toBe(0.05);
    expect(parseWeightKg('heavy')).toBeNull();
  });
});

describe('loot rows', () => {
  it('derives price per cell and per kg from price, size and weight', () => {
    const row = toLootRow(item({ name: 'Scotch', gridSize: '1x2', sellPrice: '$5,451', pricePerCell: '$2,726', weight: '2.100 kg' }));

    expect(row.price).toBe(5451);
    expect(row.perCell).toBe(2726);
    expect(row.perKg).toBe(2596);
  });

  it('prefers the numeric weight and falls back to the wiki per-cell price without a size', () => {
    expect(toLootRow(item({ sellPrice: '$100', gridSize: '1x1', weightKg: 0.5, weight: '9 kg' })).perKg).toBe(200);
    expect(toLootRow(item({ sellPrice: '$100', gridSize: '?', pricePerCell: '$40' })).perCell).toBe(40);
    expect(toLootRow(item({ gridSize: '2x2' }))).toMatchObject({ price: null, perCell: null, perKg: null });
  });

  const rows = [
    toLootRow(item({ id: 'a', name: 'Alpha', gridSize: '1x1', sellPrice: '$100', weightKg: 1 })),
    toLootRow(item({ id: 'b', name: 'Bravo', gridSize: '2x2', sellPrice: '$300', weightKg: 0.1 })),
    toLootRow(item({ id: 'c', name: 'Charlie', gridSize: '1x1' })),
    toLootRow(item({ id: 'd', name: 'Delta', gridSize: '1x2', sellPrice: '$200', weightKg: 5 })),
  ];

  it('sorts high-to-low with unpriced items last, and names A-Z', () => {
    expect(sortLoot(rows, 'perCell').map(r => r.name)).toEqual(['Alpha', 'Delta', 'Bravo', 'Charlie']);
    expect(sortLoot(rows, 'price').map(r => r.name)).toEqual(['Bravo', 'Delta', 'Alpha', 'Charlie']);
    expect(sortLoot(rows, 'perKg').map(r => r.name)).toEqual(['Bravo', 'Alpha', 'Delta', 'Charlie']);
    expect(sortLoot(rows, 'name').map(r => r.name)).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('filters by search text and minimum price', () => {
    expect(filterLoot(rows, 'ra', 0).map(r => r.name)).toEqual(['Bravo']);
    expect(filterLoot(rows, '', 150).map(r => r.name)).toEqual(['Bravo', 'Delta']);
    expect(filterLoot(rows, '', 0)).toHaveLength(4);
  });

  it('formats money', () => {
    expect(formatMoney(5451)).toBe('$5,451');
    expect(formatMoney(null)).toBe('–');
  });
});

describe('loot fetcher', () => {
  it('maps loot records and keeps missing fields empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => ({
        data: [
          { id: 'scotch', name: 'Scotch', grid_size: '1x2', weight: '2.100 kg', sell_price: '$5,451', price_per_grid_cell: '$2,726', numeric_values: { weight: { value: 2.1, unit: 'kg' } }, image: 'https://example.test/s.png' },
          { name: 'Rag' },
        ],
      }),
    });
    const loot = await fetchLootItems(createGzwDataClient(fetchMock));

    expect(loot[0]).toMatchObject({ id: 'scotch', gridSize: '1x2', sellPrice: '$5,451', pricePerCell: '$2,726', weightKg: 2.1 });
    expect(loot[1]).toMatchObject({ id: 'Rag', name: 'Rag', gridSize: '' });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/loot_items\?all=true$/), expect.anything());
  });
});

describe('value items from several datasets', () => {
  const ok = (data: unknown[]) => ({ ok: true, status: 200, statusText: 'OK', headers: { get: () => null }, json: async () => ({ data }) });

  it('combines priced items, keeps the first dataset for a repeated id and marks community prices', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (/\/loot_items\?/.test(url)) return ok([{ id: 'scotch', name: 'Scotch', sell_price: '$5,451' }, { id: 'rag', name: 'Rag' }]);
      if (/\/medical\?/.test(url)) return ok([{ id: 'splint', name: 'Splint', sell_price: '$17', sell_price_source: 'gzwitems.com' }, { id: 'scotch', name: 'Scotch', sell_price: '$1' }]);
      if (/\/keys\?/.test(url)) return ok([{ id: 'office-key', name: 'Office Key', sell_price: '???' }]);
      throw new Error('offline');
    });
    const items = await fetchValueItems(createGzwDataClient(fetchMock as unknown as typeof fetch));

    expect(items.map(item => item.id)).toEqual(['scotch', 'splint']);
    expect(items[0]).toMatchObject({ sellPrice: '$5,451', category: 'Loot' });
    expect(items[1]).toMatchObject({ sellPrice: '$17', category: 'Medical', priceSource: 'gzwitems.com' });
    expect(items[0].priceSource).toBeUndefined();
  });

  it('fails only when every dataset fails to load', async () => {
    const fetchMock = vi.fn(async () => { throw new Error('offline'); });
    await expect(fetchValueItems(createGzwDataClient(fetchMock as unknown as typeof fetch))).rejects.toThrow();
  });

  it('filters by category and names the price source', () => {
    const rows = [
      toLootRow(item({ id: 'a', name: 'Alpha', sellPrice: '$10', category: 'Loot' })),
      toLootRow(item({ id: 'b', name: 'Bravo', sellPrice: '$20', category: 'Medical' })),
    ];
    expect(filterLoot(rows, '', 0, 'Medical').map(row => row.name)).toEqual(['Bravo']);
    expect(filterLoot(rows, '', 0)).toHaveLength(2);
    expect(priceSourceLabel('gzwitems.com')).toBe('GZW Items');
    expect(priceSourceLabel(undefined)).toBe('');
  });
});

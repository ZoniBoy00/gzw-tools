import { describe, expect, it } from 'vitest';
import {
  amountList,
  bestSellPrice,
  cheapestOffer,
  craftTimeLabel,
  filterGameItems,
  findGameItem,
  formatChance,
  formatSell,
  gameItemTitle,
  formatDollars,
  gridLabel,
  indexItemNames,
  lootTableLabel,
  resolveSlots,
  sortGameItems,
  statLabel,
  topLootSources,
  weightLabel,
} from './gameData';
import type { CompatHost, GameItem, LootByItem } from './gameData';

const item = (overrides: Partial<GameItem>): GameItem => ({ id: 'x', name: 'X', category: 'misc', ...overrides });

describe('weight and grid labels', () => {
  it('labels composite items as base values', () => {
    expect(weightLabel(item({ base_weight: '2 kg' }))).toEqual({ label: 'Base weight', value: '2 kg' });
    expect(gridLabel(item({ base_grid_size: '5x2' }))).toEqual({ label: 'Base grid', value: '5x2' });
  });
  it('prefers the full weight and grid', () => {
    expect(weightLabel(item({ weight: '0.085 kg', base_weight: '1 kg' }))?.label).toBe('Weight');
    expect(gridLabel(item({ grid_size: '1x1' }))?.label).toBe('Grid');
    expect(weightLabel(item({}))).toBeNull();
  });
});

describe('prices', () => {
  it('formats the integer part of a price', () => {
    expect(formatDollars(132.6)).toBe('$132');
    expect(formatDollars(3300)).toBe('$3,300');
    expect(formatDollars(undefined)).toBe('–');
  });
  it('keeps decimals for cheap sell prices', () => {
    expect(formatSell(1.2)).toBe('$1.2');
    expect(formatSell(45)).toBe('$45');
    expect(formatSell(255.3)).toBe('$255');
  });
  it('picks the cheapest vendor offer and the best sell price', () => {
    const it = item({
      vendors: [{ vendor: 'Gunny', rank: 3, price: 132 }, { vendor: 'Banshee', rank: 2, price: 120 }],
      sell_prices: [{ vendors: ['Gunny'], price: 45 }, { vendors: ['Banshee'], price: 60 }],
    });
    expect(cheapestOffer(it)).toEqual({ vendor: 'Banshee', rank: 2, price: 120 });
    expect(bestSellPrice(it)).toEqual({ vendors: ['Banshee'], price: 60 });
    expect(cheapestOffer(item({}))).toBeNull();
    expect(bestSellPrice(item({}))).toBeNull();
  });
});

describe('filter and sort', () => {
  const items = [
    item({ id: 'a', name: 'AK-12', category: 'firearms', base_weight: '2 kg', base_price: 5000 }),
    item({ id: 'b', name: 'PMAG', category: 'magazines', weight: '0.12 kg', base_price: 150, manufacturer: 'Magpul' }),
    item({ id: 'c', name: 'Bandage', category: 'consumables' }),
  ];
  it('filters by text, manufacturer and category', () => {
    expect(filterGameItems(items, 'ak', '').map(i => i.id)).toEqual(['a']);
    expect(filterGameItems(items, 'magpul', '').map(i => i.id)).toEqual(['b']);
    expect(filterGameItems(items, '', 'consumables').map(i => i.id)).toEqual(['c']);
  });
  it('hides developer test items and shows the original name of variants', () => {
    const list = [item({ id: 'd', name: '<DEV> TEST CRAFT ITEM' }), item({ id: 'v', name: 'Rig (Rig_V2)', display_name: 'Rig' })];
    expect(filterGameItems(list, '', '').map(i => i.id)).toEqual(['v']);
    expect(gameItemTitle(list[1])).toBe('Rig');
    expect(gameItemTitle(item({ name: 'Plain' }))).toBe('Plain');
  });
  it('turns stat keys into words', () => {
    expect(statLabel('manipulationModifier')).toBe('manipulation Modifier');
    expect(statLabel('fire_rate')).toBe('fire rate');
  });
  it('sorts numbers high to low with missing values last', () => {
    expect(sortGameItems(items, 'price').map(i => i.id)).toEqual(['a', 'b', 'c']);
    expect(sortGameItems(items, 'weight').map(i => i.id)).toEqual(['a', 'b', 'c']);
    expect(sortGameItems(items, 'name').map(i => i.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('loot sources', () => {
  const record: LootByItem = {
    id: 'i',
    name: 'I',
    found_in: [
      { table: 'DA_LootTable_LootBox_A1_UnAmmo', source: 'LootBoxes', chance_per_roll: 0.15 },
      { table: 'DA_LootTable_LooseLoot_A1_Ammo', source: 'LooseLoot', chance_per_roll: 0.28333 },
    ],
  };
  it('sorts by chance and limits the list', () => {
    expect(topLootSources(record, 1)[0].chance_per_roll).toBe(0.28333);
    expect(topLootSources(undefined)).toEqual([]);
  });
  it('formats table ids and chances', () => {
    expect(lootTableLabel('DA_LootTable_LootBox_A1_UnAmmo')).toBe('LootBox A1 UnAmmo');
    expect(formatChance(0.28333)).toBe('28 %');
    expect(formatChance(0.0526)).toBe('5.3 %');
    expect(formatChance(0.00515)).toBe('0.52 %');
  });
});

describe('compatibility', () => {
  it('resolves accept ids to sorted names and keeps unknown ids', () => {
    const host: CompatHost = {
      id: 'gun',
      name: 'Gun',
      slots: [{ slot: 'Muzzle', critical: false, welded: false, socket_types: [], accepts: ['m2', 'm1', 'unknown'] }],
    };
    const names = indexItemNames([item({ id: 'm1', name: 'Brake' }), item({ id: 'm2', name: 'Compensator' })]);
    expect(resolveSlots(host, names)[0].accepts.map(a => a.name)).toEqual(['Brake', 'Compensator', 'unknown']);
    expect(resolveSlots(undefined, names)).toEqual([]);
  });
});

describe('hideout formatting', () => {
  it('formats craft times and amount lists', () => {
    expect(craftTimeLabel(45)).toBe('45 s');
    expect(craftTimeLabel(120)).toBe('2 min');
    expect(craftTimeLabel(135)).toBe('2 min 15 s');
    expect(amountList([{ id: 'a', name: 'Plastics', amount: 2 }, { id: 'b', name: null, amount: 1 }])).toBe('2× Plastics, b');
  });
});

describe('findGameItem', () => {
  const list = [
    item({ id: 'v1', name: 'Kangaroo Rig (Rig_V1)', display_name: 'Kangaroo Rig' }),
    item({ id: 'b', name: 'Kangaroo Rig' }),
    item({ id: 'a', name: 'AK-12' }),
    item({ id: 'd', name: '<DEV> AK-12' }),
  ];
  it('matches wiki names ignoring case and punctuation', () => {
    expect(findGameItem(list, 'ak 12')?.id).toBe('a');
    expect(findGameItem(list, 'AK-12')?.id).toBe('a');
  });
  it('prefers the base item over variants and returns null when unknown', () => {
    expect(findGameItem(list, 'Kangaroo Rig')?.id).toBe('b');
    expect(findGameItem([list[0]], 'Kangaroo Rig')?.id).toBe('v1');
    expect(findGameItem(list, 'Nothing here')).toBeNull();
    expect(findGameItem(list, '')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { searchSite, type SiteSearchItem } from './siteSearch';
import { buildSiteSearchItems, mergeTaskSources } from './siteSearchData';
import { parseCompletedTaskIds, summarizeTaskProgress, toggleTaskCompletion } from './taskProgress';

const searchItems: SiteSearchItem[] = [
  { id: 'weapon:ak', title: 'AK-12', type: 'Weapon', detail: '5.45x39mm', path: '/weapons' },
  { id: 'ammo:sp', title: '5.45x39mm SP', type: 'Ammunition', detail: 'AK-12 compatible', path: '/ammo' },
  { id: 'task:quest', title: 'First Recon', type: 'Task', detail: 'Handshake · Tiger Bay', path: '/missions' },
];

describe('site search', () => {
  it('ranks exact and title matches before detail matches', () => {
    expect(searchSite(searchItems, 'ak-12').map(item => item.id)).toEqual(['weapon:ak', 'ammo:sp']);
  });

  it('searches details, ignores blank queries, and respects the limit', () => {
    expect(searchSite(searchItems, 'tiger')).toEqual([searchItems[2]]);
    expect(searchSite(searchItems, '  ')).toEqual([]);
    expect(searchSite(searchItems, 'a', 1)).toHaveLength(1);
  });

  it('merges task categories and deduplicates records while preserving hidden status', () => {
    const task = { id: 'main-1', name: 'First Recon', vendor: 'Handshake' };
    const hidden = { id: 'hidden-1', name: 'At Doom\'s Gate', vendor: 'Handshake' };
    expect(mergeTaskSources([task], [task], [], [hidden], [], [])).toEqual([
      task,
      { ...hidden, category: 'hidden_task' },
    ]);
  });

  it('indexes every supported site data category including vendor items', () => {
    const items = buildSiteSearchItems({
      weapons: [{ name: 'AK-12', caliber: '5.45x39mm' }],
      ammo: [{ name: 'SP', caliber: '5.45x39mm' }],
      vests: [{ name: 'Vest A' }],
      helmets: [{ name: 'Helmet A' }],
      keys: [{ name: 'Office Key', location: 'Tiger Bay' }],
      tasks: [{ id: 't1', name: 'Recon', vendor: 'Handshake', location: 'Tiger Bay' }],
    });
    expect(new Set(items.map(item => item.type))).toEqual(new Set(['Task', 'Weapon', 'Ammunition', 'Armor', 'Helmet', 'Key', 'Vendor']));
    expect(items.find(item => item.id === 'task:t1')?.searchParams).toEqual({ search: 'Recon' });
    expect(items.find(item => item.id === 'weapon:AK-12')?.searchParams).toEqual({ wsearch: 'AK-12' });
    expect(items.find(item => item.id === 'ammo:5.45x39mm:SP')?.searchParams).toEqual({ asearch: 'SP', caliber: '5.45x39mm' });
    expect(items.find(item => item.id === 'key:Office Key')?.searchParams).toEqual({ keysearch: 'Office Key' });
  });
});

describe('task progress', () => {
  it('parses stored completion IDs safely and deduplicates them', () => {
    expect(parseCompletedTaskIds('["a","a",1]')).toEqual(['a']);
    expect(parseCompletedTaskIds('{bad')).toEqual([]);
  });

  it('toggles completion and summarizes progress by vendor', () => {
    const completed = toggleTaskCompletion([], 'a');
    expect(toggleTaskCompletion(completed, 'a')).toEqual([]);
    expect(summarizeTaskProgress([{ id: 'a', vendor: 'Handshake' }, { id: 'b', vendor: 'Handshake' }, { id: 'c' }], completed)).toEqual([
      { vendor: 'Handshake', completed: 1, total: 2 },
      { vendor: 'Unassigned', completed: 0, total: 1 },
    ]);
  });
});

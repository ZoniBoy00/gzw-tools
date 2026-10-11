import type { SiteSearchItem } from './siteSearch';
import type { BossEntry, RegionEntry } from './api';
import { VENDORS } from './calc';

export interface TaskSearchRecord {
  id: string;
  name: string;
  vendor?: string;
  location?: string;
  area?: string;
  objectives?: string[] | string;
}

export function mergeTaskSources(tasks: TaskSearchRecord[], mainTasks: TaskSearchRecord[], sideTasks: TaskSearchRecord[], hiddenTasks: TaskSearchRecord[], squadTasks: TaskSearchRecord[], contracts: TaskSearchRecord[]): TaskSearchRecord[] {
  const hiddenIds = new Set(hiddenTasks.map(task => task.id));
  const seen = new Set<string>();
  const merged: TaskSearchRecord[] = [];
  for (const source of [tasks, mainTasks, sideTasks, hiddenTasks, squadTasks, contracts]) {
    for (const task of source) {
      if (seen.has(task.id)) continue;
      seen.add(task.id);
      merged.push({ ...task, ...(hiddenIds.has(task.id) ? { category: 'hidden_task' } : {}) });
    }
  }
  return merged;
}

export function buildSiteSearchItems(data: {
  weapons: { name: string; type?: string; caliber?: string; source?: string }[];
  ammo: { name: string; caliber: string; source?: string; vendor?: string }[];
  vests: { name: string; nij?: string; source?: string }[];
  helmets: { name: string; nij?: string; source?: string }[];
  keys: { name: string; type?: string; location?: string; usage?: string }[];
  regions: RegionEntry[];
  bosses: BossEntry[];
  tasks: TaskSearchRecord[];
}): SiteSearchItem[] {
  return [
    ...data.tasks.map(item => ({ id: `task:${item.id}`, title: item.name, type: 'Task', detail: [item.vendor, item.location || item.area].filter(Boolean).join(' · '), path: '/missions', keywords: Array.isArray(item.objectives) ? item.objectives.join(' ') : item.objectives, searchParams: { search: item.name } })),
    ...data.weapons.map(item => ({ id: `weapon:${item.name}`, title: item.name, type: 'Weapon', detail: [item.type, item.caliber, item.source].filter(Boolean).join(' · '), path: '/weapons', searchParams: { wsearch: item.name } })),
    ...data.ammo.map(item => ({ id: `ammo:${item.caliber}:${item.name}`, title: item.name, type: 'Ammunition', detail: [item.caliber, item.vendor || item.source].filter(Boolean).join(' · '), path: '/ammo', searchParams: { asearch: item.name, caliber: item.caliber } })),
    ...data.vests.map(item => ({ id: `vest:${item.name}`, title: item.name, type: 'Armor', detail: [item.nij, item.source].filter(Boolean).join(' · '), path: '/armor', searchParams: { tab: 'vests' } })),
    ...data.helmets.map(item => ({ id: `helmet:${item.name}`, title: item.name, type: 'Helmet', detail: [item.nij, item.source].filter(Boolean).join(' · '), path: '/armor', searchParams: { tab: 'helmets' } })),
    ...data.keys.map(item => ({ id: `key:${item.name}`, title: item.name, type: item.type || 'Key', detail: [item.location, item.usage].filter(Boolean).join(' · '), path: '/keys', searchParams: { keysearch: item.name } })),
    ...data.regions.map(item => ({ id: `region:${item.id}`, title: item.name, type: 'Region', detail: [`Tier ${item.tier}`, item.localsType, item.lzCallsigns.length ? `LZ ${item.lzCallsigns.join(', ')}` : ''].filter(Boolean).join(' · '), path: '/regions', keywords: item.description, searchParams: { tab: 'regions', search: item.name } })),
    ...data.bosses.map(item => ({ id: `boss:${item.id}`, title: item.name, type: 'Boss', detail: [item.faction.includes('?') ? '' : item.faction, item.location].filter(Boolean).join(' · '), path: '/regions', keywords: [item.fullName, item.tasks].filter(Boolean).join(' '), searchParams: { tab: 'bosses', search: item.name } })),
    ...VENDORS.map(item => ({ id: `vendor:${item.slug}`, title: item.name, type: 'Vendor', detail: item.desc, path: '/' })),
  ];
}

import type { HideoutModuleLevel, HideoutRequirement } from './api';

export interface HideoutModule {
  key: string;
  room: string;
  module: string;
  levels: HideoutModuleLevel[];
  maxLevel: number;
}

export interface HideoutRoom {
  room: string;
  modules: HideoutModule[];
}

/** Level the player has built (0 = not built) and the level they want, per module key. */
export type HideoutPlan = Record<string, { current: number; target: number }>;

export function moduleKey(room: string, module: string): string {
  return `${room}::${module}`;
}

/** Group flat level records into rooms and modules, keeping the wiki room order and ascending levels. */
export function groupHideout(levels: HideoutModuleLevel[]): HideoutRoom[] {
  const rooms = new Map<string, Map<string, HideoutModule>>();
  for (const entry of levels) {
    const modules = rooms.get(entry.room) ?? new Map<string, HideoutModule>();
    const key = moduleKey(entry.room, entry.module);
    const module = modules.get(key) ?? { key, room: entry.room, module: entry.module, levels: [], maxLevel: 0 };
    module.levels.push(entry);
    module.maxLevel = Math.max(module.maxLevel, entry.level);
    modules.set(key, module);
    rooms.set(entry.room, modules);
  }
  return [...rooms.entries()].map(([room, modules]) => ({
    room,
    modules: [...modules.values()].map(module => ({ ...module, levels: [...module.levels].sort((a, b) => a.level - b.level) })),
  }));
}

/** Total of every requirement needed to go from each module's current level up to its target level. */
export function computeUpgradeCost(rooms: HideoutRoom[], plan: HideoutPlan): HideoutRequirement[] {
  const totals = new Map<string, number>();
  for (const room of rooms) {
    for (const module of room.modules) {
      const step = plan[module.key];
      if (!step) continue;
      for (const level of module.levels) {
        if (level.level <= step.current || level.level > step.target) continue;
        for (const requirement of level.requirements) {
          totals.set(requirement.name, (totals.get(requirement.name) ?? 0) + requirement.quantity);
        }
      }
    }
  }
  return [...totals.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => (a.name === 'Dollars' ? -1 : b.name === 'Dollars' ? 1 : b.quantity - a.quantity || a.name.localeCompare(b.name)));
}

/** Restore a saved plan, dropping unknown modules and clamping levels to what exists. */
export function parseHideoutPlan(raw: string | null, rooms: HideoutRoom[]): HideoutPlan {
  if (!raw) return {};
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return {}; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const plan: HideoutPlan = {};
  for (const module of rooms.flatMap(room => room.modules)) {
    const entry = (value as Record<string, unknown>)[module.key];
    if (!entry || typeof entry !== 'object') continue;
    const { current, target } = entry as { current?: unknown; target?: unknown };
    if (typeof current !== 'number' || typeof target !== 'number') continue;
    const clampedCurrent = Math.min(Math.max(Math.trunc(current), 0), module.maxLevel);
    const clampedTarget = Math.min(Math.max(Math.trunc(target), clampedCurrent), module.maxLevel);
    plan[module.key] = { current: clampedCurrent, target: clampedTarget };
  }
  return plan;
}

export function formatRequirement(requirement: HideoutRequirement): string {
  return requirement.name === 'Dollars'
    ? `$${requirement.quantity.toLocaleString('en-US')}`
    : `${requirement.quantity}x ${requirement.name}`;
}

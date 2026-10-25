import { describe, expect, it } from 'vitest';
import { computeUpgradeCost, formatRequirement, groupHideout, parseHideoutPlan } from './hideout';
import type { HideoutModuleLevel } from './api';

const level = (room: string, module: string, lvl: number, requirements: [string, number][]): HideoutModuleLevel => ({
  id: `${room}-${module}-${lvl}`,
  room,
  module,
  level: lvl,
  requirements: requirements.map(([name, quantity]) => ({ name, quantity })),
  function: '',
});

const levels = [
  level('Laboratory', 'Heat Source', 2, [['Steel', 4], ['Dollars', 10000]]),
  level('Laboratory', 'Heat Source', 1, [['Steel', 3], ['Wood', 1]]),
  level('Laboratory', 'Storage Equipment', 1, [['Copper', 2]]),
  level('Electronics Workshop', 'Storage Equipment', 1, [['Copper', 5]]),
];

describe('hideout planner', () => {
  it('groups levels into rooms and modules with ascending levels', () => {
    const rooms = groupHideout(levels);

    expect(rooms.map(room => room.room)).toEqual(['Laboratory', 'Electronics Workshop']);
    const heat = rooms[0].modules[0];
    expect(heat.levels.map(entry => entry.level)).toEqual([1, 2]);
    expect(heat.maxLevel).toBe(2);
    expect(rooms[1].modules[0].key).toBe('Electronics Workshop::Storage Equipment');
  });

  it('sums only the levels between current and target, across modules', () => {
    const rooms = groupHideout(levels);
    const cost = computeUpgradeCost(rooms, {
      'Laboratory::Heat Source': { current: 0, target: 2 },
      'Laboratory::Storage Equipment': { current: 0, target: 1 },
      'Electronics Workshop::Storage Equipment': { current: 1, target: 1 },
    });

    expect(cost).toEqual([
      { name: 'Dollars', quantity: 10000 },
      { name: 'Steel', quantity: 7 },
      { name: 'Copper', quantity: 2 },
      { name: 'Wood', quantity: 1 },
    ]);
    expect(computeUpgradeCost(rooms, { 'Laboratory::Heat Source': { current: 1, target: 2 } })).toEqual([
      { name: 'Dollars', quantity: 10000 },
      { name: 'Steel', quantity: 4 },
    ]);
    expect(computeUpgradeCost(rooms, {})).toEqual([]);
  });

  it('restores saved plans safely', () => {
    const rooms = groupHideout(levels);

    expect(parseHideoutPlan(null, rooms)).toEqual({});
    expect(parseHideoutPlan('not json', rooms)).toEqual({});
    expect(parseHideoutPlan('[]', rooms)).toEqual({});
    expect(parseHideoutPlan(JSON.stringify({
      'Laboratory::Heat Source': { current: -3, target: 99 },
      'Laboratory::Removed Module': { current: 1, target: 2 },
      'Laboratory::Storage Equipment': { current: 'x', target: 1 },
    }), rooms)).toEqual({ 'Laboratory::Heat Source': { current: 0, target: 2 } });
  });

  it('formats dollars and item quantities', () => {
    expect(formatRequirement({ name: 'Dollars', quantity: 40000 })).toBe('$40,000');
    expect(formatRequirement({ name: 'Steel', quantity: 3 })).toBe('3x Steel');
  });
});

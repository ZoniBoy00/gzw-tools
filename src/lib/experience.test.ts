import { describe, expect, it } from 'vitest';
import { clampLevel, computeXpProgress, levelForXp, repeatsNeeded, rewardsBetween } from './experience';
import type { ExperienceAction, ExperienceLevel } from './api';

const levels: ExperienceLevel[] = [
  { id: 'level-1', level: 1, threshold: 0, rewards: ['Gloves'] },
  { id: 'level-2', level: 2, threshold: 600, rewards: [] },
  { id: 'level-3', level: 3, threshold: 1500, rewards: ['T-shirt'] },
  { id: 'level-4', level: 4, threshold: 2700, rewards: ['Boots', 'Jeans'] },
];

const actions: ExperienceAction[] = [
  { id: 'poi', name: 'Points of Interest', category: 'Discovering POIs', experience: 30 },
  { id: 'pmc', name: 'Other PMCs (Players)', category: 'Kills', experience: 200 },
  { id: 'none', name: 'Broken row', category: 'Kills', experience: 0 },
];

describe('experience calculator', () => {
  it('works out the experience remaining between levels, including progress', () => {
    expect(computeXpProgress(levels, 1, 0, 3)).toEqual({ remaining: 1500, currentXp: 0, targetXp: 1500, nextLevelCost: 600 });
    expect(computeXpProgress(levels, 2, 400, 4)).toEqual({ remaining: 1700, currentXp: 1000, targetXp: 2700, nextLevelCost: 900 });
  });

  it('limits progress to the size of the level and never goes below zero', () => {
    expect(computeXpProgress(levels, 2, 99999, 3)?.remaining).toBe(0);
    expect(computeXpProgress(levels, 2, -50, 3)?.remaining).toBe(900);
    expect(computeXpProgress(levels, 2, Number.NaN, 3)?.remaining).toBe(900);
    expect(computeXpProgress(levels, 3, 0, 2)?.remaining).toBe(0);
  });

  it('handles the top level and unknown levels', () => {
    expect(computeXpProgress(levels, 4, 500, 4)).toEqual({ remaining: 0, currentXp: 2700, targetXp: 2700, nextLevelCost: null });
    expect(computeXpProgress(levels, 9, 0, 4)).toBeNull();
    expect(computeXpProgress([], 1, 0, 1)).toBeNull();
  });

  it('finds the level for a total experience amount and clamps levels', () => {
    expect(levelForXp(levels, 0)).toBe(1);
    expect(levelForXp(levels, 1499)).toBe(2);
    expect(levelForXp(levels, 1500)).toBe(3);
    expect(levelForXp(levels, 999999)).toBe(4);
    expect(clampLevel(levels, 0)).toBe(1);
    expect(clampLevel(levels, 99)).toBe(4);
    expect(clampLevel([], 5)).toBe(1);
  });

  it('rounds repeat counts up and skips actions without experience', () => {
    expect(repeatsNeeded(1500, actions).map(entry => [entry.action.id, entry.count])).toEqual([['poi', 50], ['pmc', 8]]);
    expect(repeatsNeeded(1, actions).map(entry => entry.count)).toEqual([1, 1]);
  });

  it('lists rewards only for levels gained on the way', () => {
    expect(rewardsBetween(levels, 1, 4)).toEqual([{ level: 3, rewards: ['T-shirt'] }, { level: 4, rewards: ['Boots', 'Jeans'] }]);
    expect(rewardsBetween(levels, 3, 3)).toEqual([]);
  });
});

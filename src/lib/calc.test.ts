import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RATE,
  MISSION_TYPES,
  calcDollarsToRep,
  calcMissionsToGoal,
  calcRepToDollars,
  formatCurrency,
  formatNumber,
} from './calc';

describe('calculator domain logic', () => {
  it('calculates rep-to-dollar cost and capped progress', () => {
    const result = calcRepToDollars(7_000, 10_000, DEFAULT_RATE, 13_000);
    expect(result.diff).toBe(3_000);
    expect(result.cost).toBe(300_000);
    expect(result.progressPct).toBeCloseTo(53.846, 2);
    expect(result.progressAfterPct).toBeCloseTo(76.923, 2);
  });

  it('never charges when current rep already reaches the target', () => {
    expect(calcRepToDollars(10_000, 9_000).cost).toBe(0);
    expect(calcRepToDollars(10_000, 9_000).diff).toBe(0);
  });

  it('converts dollars to whole reputation points', () => {
    expect(calcDollarsToRep(999, 100)).toBe(9);
    expect(calcDollarsToRep(1_000, 100)).toBe(10);
  });

  it('returns a greedy mission plan that reaches the target', () => {
    const result = calcMissionsToGoal(0, 275, MISSION_TYPES);
    const earned = result.reduce((sum, mission) => sum + mission.repEach * mission.count, 0);
    expect(earned).toBeGreaterThanOrEqual(275);
    expect(result[0]?.type).toBe('Critical Op');
  });

  it('returns no missions for an already completed goal', () => {
    expect(calcMissionsToGoal(500, 250, MISSION_TYPES)).toEqual([]);
  });

  it('formats user-facing numbers consistently', () => {
    expect(formatCurrency(1250)).toBe('$1,250');
    expect(formatNumber(1250000)).toBe('1,250,000');
  });
});

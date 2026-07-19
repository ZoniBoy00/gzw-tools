// Gray Zone Warfare — Rep & Tool Calculator

export const MAX_REP = 13000;
export const DEFAULT_RATE = 100;

/* GZW Vendors */
export const VENDORS = [
  { name: 'Artisan', slug: 'artisan', rep: 7277, desc: 'Weapons & Attachments' },
  { name: 'Gunny', slug: 'gunny', rep: 5000, desc: 'Ammo & Weapon Mods' },
  { name: 'Banshee', slug: 'banshee', rep: 3500, desc: 'Armor & Tactical Gear' },
  { name: 'Lab Rat', slug: 'labrat', rep: 2500, desc: 'Medical Supplies' },
  { name: 'Mithras', slug: 'mithras', rep: 1500, desc: 'General Equipment' },
];

export const VENDOR_MAX = 13000;

/* Mission types (GZW-style) */
export const MISSION_TYPES = [
  { name: 'Task Mission', rep: 25 },
  { name: 'Supply Run', rep: 50 },
  { name: 'Recon Mission', rep: 75 },
  { name: 'Elimination', rep: 100 },
  { name: 'Elite Task', rep: 150 },
  { name: 'Critical Op', rep: 200 },
];

export interface RepCalcResult {
  current: number;
  target: number;
  diff: number;
  rate: number;
  cost: number;
  progressPct: number;
  progressAfterPct: number;
}

export interface MissionCalcResult {
  type: string;
  repEach: number;
  count: number;
}

export function calcRepToDollars(
  current: number,
  target: number,
  rate: number = DEFAULT_RATE
): RepCalcResult {
  const diff = Math.max(0, target - current);
  return {
    current,
    target,
    diff,
    rate,
    cost: diff * rate,
    progressPct: Math.min((current / MAX_REP) * 100, 100),
    progressAfterPct: Math.min((target / MAX_REP) * 100, 100),
  };
}

export function calcDollarsToRep(
  dollars: number,
  rate: number = DEFAULT_RATE
): number {
  return Math.floor(dollars / rate);
}

export function calcMissionsToGoal(
  current: number,
  target: number,
  missionTypes: { name: string; rep: number }[]
): MissionCalcResult[] {
  const needed = Math.max(0, target - current);
  if (needed <= 0 || missionTypes.length === 0) return [];

  const sorted = [...missionTypes].sort((a, b) => b.rep - a.rep);
  const results: MissionCalcResult[] = [];
  let remaining = needed;

  for (const mission of sorted) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / mission.rep);
    if (count > 0) {
      results.push({ type: mission.name, repEach: mission.rep, count });
      remaining -= count * mission.rep;
    }
  }

  if (remaining > 0 && missionTypes.length > 0) {
    const smallest = [...missionTypes].sort((a, b) => a.rep - b.rep)[0];
    const existing = results.find((r) => r.type === smallest.name);
    if (existing) {
      existing.count += 1;
    } else {
      results.push({ type: smallest.name, repEach: smallest.rep, count: 1 });
    }
  }

  return results;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

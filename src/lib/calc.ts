// Gray Zone Warfare — Rep & Tool Calculator

export const MAX_REP = 13000;
export const DEFAULT_RATE = 100;

/* GZW Vendors with per-vendor max rep and rank thresholds */
export interface VendorInfo {
  name: string;
  slug: string;
  rep: number;
  maxRep: number;
  desc: string;
  /** Cumulative rep needed for each rank (index 0 = R.1, 1 = R.2, etc.) */
  rankCumulative: number[];
}

export const VENDORS: VendorInfo[] = [
  { name: 'Handshake', slug: 'handshake', rep: 7277, maxRep: 13000, desc: 'Early missions & gear',
    rankCumulative: [0, 1250, 9500, 13000] },
  { name: 'Gunny', slug: 'gunny', rep: 5000, maxRep: 13000, desc: 'Ammo & Weapon Mods',
    rankCumulative: [0, 800, 9500, 13000] },
  { name: 'Lab Rat', slug: 'labrat', rep: 2500, maxRep: 13000, desc: 'Medical Supplies',
    rankCumulative: [0, 800, 9500, 13000] },
  { name: 'Artisan', slug: 'artisan', rep: 7277, maxRep: 9750, desc: 'Weapons & Attachments',
    rankCumulative: [0, 700, 3750, 9750] },
  { name: 'Turncoat', slug: 'turncoat', rep: 3500, maxRep: 9750, desc: 'Suspicious Goods',
    rankCumulative: [0, 700, 3750, 9750] },
  { name: 'Banshee', slug: 'banshee', rep: 3500, maxRep: 9750, desc: 'Armor & Tactical Gear',
    rankCumulative: [0, 700, 3750, 9750] },
  { name: 'Vulture', slug: 'vulture', rep: 0, maxRep: 9750, desc: 'Player-dropped Loot & Special Gear',
    rankCumulative: [0, 750, 3750, 9750] },
];

export function getVendorMaxRep(slug: string): number {
  return VENDORS.find((v) => v.slug === slug)?.maxRep ?? MAX_REP;
}

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
  maxRep: number;
}

export interface MissionCalcResult {
  type: string;
  repEach: number;
  count: number;
}

export function calcRepToDollars(
  current: number,
  target: number,
  rate: number = DEFAULT_RATE,
  maxRep: number = MAX_REP,
): RepCalcResult {
  const diff = Math.max(0, target - current);
  return {
    current,
    target,
    diff,
    rate,
    cost: diff * rate,
    progressPct: Math.min((current / maxRep) * 100, 100),
    progressAfterPct: Math.min((target / maxRep) * 100, 100),
    maxRep,
  };
}

export function calcDollarsToRep(
  dollars: number,
  rate: number = DEFAULT_RATE,
): number {
  return Math.floor(dollars / rate);
}

export function calcMissionsToGoal(
  current: number,
  target: number,
  missionTypes: { name: string; rep: number }[],
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

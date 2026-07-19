import type { ArmorVest, Helmet, GearRecommendation } from '../types';

export const VESTS: ArmorVest[] = [
  { name: 'Coolmax Covert Vest', nij: 'IIIA', material: 'Aramid', plates: 'Front, Back', grid: '3×3', weight: 1.76, source: 'Looting' },
  { name: 'Covert Tactical (UNLRA)', nij: 'IIIA', material: 'Aramid', plates: 'Front, Back', grid: '3×3', weight: 2.1, source: 'Looting' },
  { name: 'Commander (Black/Navy/Olive)', nij: 'IIIA', material: 'Aramid', plates: 'Front, Back', grid: '3×3', weight: 2.45, source: 'Handshake R.1' },
  { name: 'Molle Vest', nij: 'IIIA', material: 'Steel', plates: 'Front', grid: '3×3', weight: 2.6, source: 'Artisan R.1' },
  { name: 'LVS Overt (Ranger Green)', nij: 'IIIA+', material: 'Steel', plates: 'Front, Back', grid: '3×3', weight: 7.5, source: 'Handshake R.1' },
  { name: 'SK-S Ballistic Vest', nij: 'III', material: 'UHMWPE', plates: 'Front, Back', grid: '3×3', weight: 3.15, source: 'Turncoat R.2' },
  { name: 'ATBV Vest', nij: 'III', material: 'UHMWPE', plates: 'Front, Back', grid: '3×3', weight: 3.8, source: 'Turncoat R.2' },
  { name: 'CZ VIP (Black)', nij: 'III', material: 'Steel', plates: 'Front', grid: '3×3', weight: 4.8, source: 'Handshake R.2' },
  { name: 'Covert Tactical (Police)', nij: 'III', material: 'UHMWPE', plates: 'Front, Back', grid: '3×3', weight: 5.77, source: 'Looting' },
  { name: 'CZ 4M Hornet (UNLRA)', nij: 'III', material: 'Ceramic', plates: 'Front, Back', grid: '3×3', weight: 6.45, source: 'Looting' },
  { name: 'Covert Tactical (Woodland)', nij: 'III', material: 'Steel', plates: 'Front, Back', grid: '3×3', weight: 8.8, source: 'Handshake R.2' },
  { name: 'LVS Tactical (Ranger Green)', nij: 'III', material: 'Steel', plates: 'Front, Back, Sides', grid: '3×3', weight: 10.8, source: 'Handshake R.2' },
  { name: '6B23-1 (Flora)', nij: 'III+', material: 'Steel', plates: 'Front', grid: '3×4', weight: 7.4, source: 'Turncoat R.3' },
  { name: '6B23-1 (Digital)', nij: 'III+', material: 'Steel', plates: 'Front', grid: '3×4', weight: 7.9, source: 'Looting' },
  { name: 'CZ 4M Hornet (Green)', nij: 'III+', material: 'Ceramic', plates: 'Front, Back', grid: '3×3', weight: 6.9, source: 'Handshake R.3' },
  { name: 'LVS Tactical (Multicam)', nij: 'III++', material: 'Ceramic', plates: 'Front, Back, Sides', grid: '3×3', weight: 8.2, source: 'Handshake R.4' },
];

export const HELMETS: Helmet[] = [
  { name: 'SS-27 (Black)', nij: 'IIA', material: 'Aramid', weight: 1.3, source: 'Artisan R.1' },
  { name: 'SS-27 (Multicam)', nij: 'IIA', material: 'Aramid', weight: 1.3, source: 'Looting' },
  { name: 'ACH (Olive)', nij: 'IIIA', material: 'Aramid', weight: 1.5, source: 'Turncoat R.2' },
  { name: 'MICH (Olive)', nij: 'IIIA', material: 'Steel', weight: 1.6, source: 'Handshake R.2' },
  { name: 'FAST Carbon', nij: 'IIIA', material: 'Aramid', weight: 1.1, source: 'Banshee R.2' },
];

export const RECOMMENDATIONS: GearRecommendation[] = [
  {
    tier: 'T1', label: 'Budget / Early', vest: 'Molle Vest (IIIA)', helmet: 'SS-27 (IIA)',
    ammo: ['5.56x45mm FMJ / M193', '7.62x39mm PS', '9x19mm FMJ'],
    notes: 'Good vs AI. Avoid geared PvP players.',
  },
  {
    tier: 'T2', label: 'Mid Tier', vest: 'SK-S Ballistic Vest (III) or ATBV (III)', helmet: 'ACH (IIIA)',
    ammo: ['5.56x45mm AP (M855)', '5.45x39mm PP (7N10)', '7.62x39mm BP (7N23)'],
    notes: 'Can fight players with basic rifles. SK-S is only 3.15kg.',
  },
  {
    tier: 'T3', label: 'High Tier', vest: 'CZ 4M Hornet (III+) or 6B23-1 (III+)', helmet: 'FAST Carbon (IIIA)',
    ammo: ['5.56x45mm AP (M855A1)', '5.45x39mm BP (7N22)', '7.62x51mm AP (M61)'],
    notes: 'Ceramic plates stop most rifle rounds. Side plates matter.',
  },
  {
    tier: 'T4', label: 'End Game', vest: 'LVS Tactical (III++) Multicam', helmet: 'FAST Carbon (IIIA)',
    ammo: ['5.56x45mm AP (M995)', '7.62x51mm AP (M61)', '7.62x54R AP (7N13)'],
    notes: 'Best in slot. Full coverage (F/B/S) with ceramic plates.',
  },
];

export const VENDOR_GEAR = [
  { vendor: 'Handshake', rep: 1, items: 'Commander IIIA vests, LVS Overt IIIA+' },
  { vendor: 'Handshake', rep: 2, items: 'Covert Woodland III, LVS Tactical III, MICH IIA helmet' },
  { vendor: 'Handshake', rep: 3, items: 'CZ 4M Hornet Green III+' },
  { vendor: 'Handshake', rep: 4, items: 'LVS Tactical Multicam III++ (best armor)' },
  { vendor: 'Artisan', rep: 1, items: 'Molle Vest IIIA, SS-27 IIA helmet' },
  { vendor: 'Turncoat', rep: 2, items: 'SK-S III, ATBV III, ACH IIIA helmet' },
  { vendor: 'Turncoat', rep: 3, items: '6B23-1 III+ steel vest' },
  { vendor: 'Banshee', rep: 2, items: 'FAST Carbon IIIA helmet (lightest)' },
];

export const MATERIAL_RANK: Record<string, { rank: number; desc: string; color: string }> = {
  Aramid: { rank: 1, desc: 'Light, flexible', color: 'text-blue-400' },
  UHMWPE: { rank: 2, desc: 'Light, moderate', color: 'text-cyan-400' },
  Steel: { rank: 3, desc: 'Heavy, high', color: 'text-amber-400' },
  Ceramic: { rank: 4, desc: 'Best, brittle', color: 'text-red-400' },
};

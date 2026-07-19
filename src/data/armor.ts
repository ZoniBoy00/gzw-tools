// Auto-generated from scraper + manual data.
import type { ArmorVest, Helmet, GearRecommendation } from "./types";
import data from "./armor.json" with { type: "json" };
export const VESTS = data.vests as ArmorVest[];
export const HELMETS = data.helmets as Helmet[];
export const PLATE_CARRIERS = data.plate_carriers as ArmorVest[];

// Manual data (not from wiki scraper):
export const MATERIAL_RANK: Record<string, { rank: number; desc: string; color: string }> = {
  Aramid: { rank: 1, desc: 'Light, flexible', color: 'text-blue-400' },
  UHMWPE: { rank: 2, desc: 'Light, moderate', color: 'text-cyan-400' },
  Steel: { rank: 3, desc: 'Heavy, high', color: 'text-amber-400' },
  Ceramic: { rank: 4, desc: 'Best, brittle', color: 'text-red-400' },
};
export const RECOMMENDATIONS: GearRecommendation[] = [
  { tier: 'T1', label: 'Budget / Early', vest: 'Molle Vest (IIIA)', helmet: 'SS-27 (IIA)', ammo: ['5.56x45mm FMJ / M193', '7.62x39mm PS', '9x19mm FMJ'], notes: 'Good vs AI. Avoid geared PvP.' },
  { tier: 'T2', label: 'Mid Tier', vest: 'SK-S (III) or ATBV (III)', helmet: 'ACH (IIIA)', ammo: ['5.56x45mm AP M855', '5.45x39mm PP 7N10'], notes: 'Can fight players. SK-S is only 3.15kg.' },
  { tier: 'T3', label: 'High Tier', vest: 'CZ 4M Hornet (III+)', helmet: 'FAST Carbon (IIIA)', ammo: ['5.56x45mm AP M855A1', '7.62x51mm AP M61'], notes: 'Ceramic plates stop most rifle rounds.' },
  { tier: 'T4', label: 'End Game', vest: 'LVS Tactical (III++)', helmet: 'FAST Carbon (IIIA)', ammo: ['5.56x45mm AP M995', '7.62x54R AP 7N13'], notes: 'Best in slot. Full coverage.' },
];
export const VENDOR_GEAR = [
  { vendor: 'Handshake', rep: 1, items: 'Commander IIIA, LVS Overt IIIA+' },
  { vendor: 'Handshake', rep: 2, items: 'Covert Woodland III, LVS Tactical III, MICH IIA helmet' },
  { vendor: 'Handshake', rep: 3, items: 'CZ 4M Hornet Green III+' },
  { vendor: 'Handshake', rep: 4, items: 'LVS Tactical Multicam III++' },
  { vendor: 'Gunny', rep: 1, items: '9x19mm FMJ/HP, 5.56x45mm FMJ' },
  { vendor: 'Gunny', rep: 2, items: '5.56x45mm M193/M855, 5.45x39mm FMJ, 7.62x39mm PS, 9x19mm Xtreme Pen' },
  { vendor: 'Gunny', rep: 3, items: '5.56x45mm M855A1, 5.45x39mm BP, 7.62x39mm BP, .300 AAC AP, 7.62x51mm M61, 9x19mm Libra Snail' },
  { vendor: 'Lab Rat', rep: 1, items: 'Basic Surgical Kit, Suture Kit, Small Blood Bag, Bandage, Splint' },
  { vendor: 'Lab Rat', rep: 2, items: 'EPO V2, ORI-12 V2, Meloxicam, Combat Tourniquet, Activated Charcoal' },
  { vendor: 'Lab Rat', rep: 3, items: 'Large Blood Bag, Fenethylline, Strychnine' },
  { vendor: 'Lab Rat', rep: 4, items: 'HpR 3-S, Combat Medic Pack' },
  { vendor: 'Artisan', rep: 1, items: 'Molle Vest IIIA, SS-27 IIA helmet' },
  { vendor: 'Turncoat', rep: 2, items: 'SK-S III, ATBV III, ACH IIIA helmet' },
  { vendor: 'Turncoat', rep: 3, items: '6B23-1 III+ steel vest' },
  { vendor: 'Banshee', rep: 2, items: 'FAST Carbon IIIA helmet' },
];

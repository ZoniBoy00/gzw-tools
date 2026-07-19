// GZW Tools API v2 — Expanded endpoints
// Plain JavaScript to avoid Vercel TypeScript compilation issues
// Features: ETag caching, CORS, calculator, search, stats

import { createHash } from 'node:crypto';

const CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

// ─── Static Data ───

const VENDORS = [
  { name: 'Handshake', slug: 'handshake', currentRep: 7277, maxRep: 13000, description: 'Early missions & gear' },
  { name: 'Gunny', slug: 'gunny', currentRep: 5000, maxRep: 13000, description: 'Ammo & Weapon Mods' },
  { name: 'Lab Rat', slug: 'labrat', currentRep: 2500, maxRep: 13000, description: 'Medical Supplies' },
  { name: 'Artisan', slug: 'artisan', currentRep: 7277, maxRep: 9750, description: 'Weapons & Attachments' },
  { name: 'Turncoat', slug: 'turncoat', currentRep: 3500, maxRep: 9750, description: 'Suspicious Goods' },
  { name: 'Banshee', slug: 'banshee', currentRep: 3500, maxRep: 9750, description: 'Armor & Tactical Gear' },
];

const ARMOR_CLASSES = ['I', 'IIA', 'IIA+', 'IIIA', 'IIIA+', 'III', 'III+', 'III++'];

const AMMO = [
  { caliber: '5.56x45mm', name: 'SP', speed: 930, accMod: -3, durMod: 0, pen: { I: 0, IIA: 0, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 }, source: 'Looting' },
  { caliber: '5.56x45mm', name: 'HPBT', speed: 861, accMod: -3, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
  { caliber: '5.56x45mm', name: 'FMJ', speed: 880, accMod: 0, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 1 },
  { caliber: '5.56x45mm', name: 'Tracer (M856)', speed: 917, accMod: -3, durMod: -15, tracer: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
  { caliber: '5.56x45mm', name: 'M193', speed: 1006, accMod: 2, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '5.56x45mm', name: 'AP (M855)', speed: 920, accMod: 2, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '5.56x45mm', name: 'Tracer (M856A1)', speed: 945, accMod: -4, durMod: -40, tracer: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 } },
  { caliber: '5.56x45mm', name: 'AP (M855A1)', speed: 970, accMod: 7, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '5.56x45mm', name: 'AP (M995)', speed: 1030, accMod: 5, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 } },
  { caliber: '5.45x39mm', name: 'WOLF', speed: 840, accMod: -2, durMod: 0, pen: { I: 0, IIA: 0, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '5.45x39mm', name: 'US (7U1)', speed: 303, accMod: -6, durMod: 0, subsonic: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '5.45x39mm', name: 'HP', speed: 880, accMod: -6, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 1, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '5.45x39mm', name: 'FMJ', speed: 855, accMod: 0, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 1, III: 0, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '5.45x39mm', name: 'PS (7N6)', speed: 900, accMod: -2, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
  { caliber: '5.45x39mm', name: 'BT (7BT4)', speed: 915, accMod: 2, durMod: -40, tracer: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 1, 'III++': 0 } },
  { caliber: '5.45x39mm', name: 'PP (7N10)', speed: 870, accMod: 2, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 1, 'III++': 0 } },
  { caliber: '5.45x39mm', name: 'BP (7N22)', speed: 860, accMod: 1, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '5.45x39mm', name: 'BS (7N24)', speed: 840, accMod: 6, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 } },
  { caliber: '7.62x39mm', name: 'SP', speed: 743, accMod: -2, durMod: 0, pen: { I: 0, IIA: 0, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '7.62x39mm', name: 'US', speed: 310, accMod: -6, durMod: 0, subsonic: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '7.62x39mm', name: 'Tracer (57-N-231P)', speed: 725, accMod: -3, durMod: 0, tracer: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 1, 'III++': 0 } },
  { caliber: '7.62x39mm', name: 'PS (57-N-231C)', speed: 725, accMod: 1, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 1, 'III++': 0 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '7.62x39mm', name: 'FMJ', speed: 738, accMod: -6, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
  { caliber: '7.62x39mm', name: 'BP (7N23)', speed: 740, accMod: 2, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '7.62x39mm', name: 'PP (7N27)', speed: 740, accMod: 2, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 } },
  { caliber: '.300 AAC', name: 'Subsonic', speed: 310, accMod: -6, durMod: 0, subsonic: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '.300 AAC', name: 'FMJ', speed: 633, accMod: 0, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 1, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '.300 AAC', name: 'V-MAX', speed: 724, accMod: 2, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 1, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '.300 AAC', name: 'CQ', speed: 853, accMod: 1, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
  { caliber: '.300 AAC', name: 'AP', speed: 725, accMod: 4, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '7.62x51mm', name: 'FMJ (M80)', speed: 817, accMod: 0, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
  { caliber: '7.62x51mm', name: 'HPBT', speed: 800, accMod: 4, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
  { caliber: '7.62x51mm', name: 'FMJ (M80A1)', speed: 835, accMod: 3, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 } },
  { caliber: '7.62x51mm', name: 'Tracer (M62)', speed: 820, accMod: -4, durMod: 0, tracer: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 } },
  { caliber: '7.62x51mm', name: 'AP (M61)', speed: 838, accMod: 4, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '7.62x54R', name: 'LPS (57-N-323S)', speed: 828, accMod: 1, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 1, 'III++': 0 } },
  { caliber: '7.62x54R', name: 'Tracer (T-46M)', speed: 830, accMod: -3, durMod: -40, tracer: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 1, 'III++': 0 } },
  { caliber: '7.62x54R', name: 'Sniper (7N1)', speed: 830, accMod: 5, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 } },
  { caliber: '7.62x54R', name: 'AP (7N13)', speed: 828, accMod: 2, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 } },
  { caliber: '9x19mm', name: 'FMJ', speed: 390, accMod: 0, durMod: 0, pen: { I: 2, IIA: 1, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 1 },
  { caliber: '9x19mm', name: 'HP', speed: 377, accMod: -3, durMod: 0, pen: { I: 2, IIA: 1, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 1 },
  { caliber: '9x19mm', name: 'Tracer', speed: 342, accMod: -4, durMod: 0, tracer: true, pen: { I: 2, IIA: 1, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '9x19mm', name: 'Xtreme Penetrator P+', speed: 381, accMod: 2, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '9x19mm', name: 'Libra Snail', speed: 700, accMod: 0, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '4.6x30mm', name: 'Subsonic SX', speed: 290, accMod: 0, durMod: 0, subsonic: true, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '4.6x30mm', name: 'FMJ SX', speed: 620, accMod: 0, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '4.6x30mm', name: 'Action SX', speed: 690, accMod: 0, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 1, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '4.6x30mm', name: 'AP SX', speed: 680, accMod: 0, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '4.6x30mm', name: 'V-MAX', speed: 640, accMod: 0, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 1, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '.45 ACP', name: 'JHP +P', speed: 290, accMod: -2, durMod: 0, pen: { I: 0, IIA: 0, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '.45 ACP', name: 'FMJ', speed: 260, accMod: 0, durMod: 0, pen: { I: 2, IIA: 1, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '.45 ACP', name: 'Hydra-Shok', speed: 274, accMod: 0, durMod: -15, pen: { I: 0, IIA: 0, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '.45 ACP', name: 'AP', speed: 450, accMod: 0, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '12 Gauge', name: '00 Buckshot', speed: 370, accMod: 38, durMod: 0, pen: { I: 0, IIA: 0, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '12 Gauge', name: 'FC 00 Buckshot', speed: 349, accMod: 27, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '12 Gauge', name: 'Slug', speed: 420, accMod: 42, durMod: -15, pen: { I: 0, IIA: 0, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 } },
  { caliber: '12 Gauge', name: 'SST Sabot Slug', speed: 609, accMod: 50, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 1, 'III+': 0, 'III++': 0 } },
];
const CALIBERS = [...new Set(AMMO.map(a => a.caliber))];

const VESTS = [
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

const HELMETS = [
  { name: 'SS-27 (Black)', nij: 'IIA', material: 'Aramid', weight: 1.3, source: 'Artisan R.1' },
  { name: 'SS-27 (Multicam)', nij: 'IIA', material: 'Aramid', weight: 1.3, source: 'Looting' },
  { name: 'ACH (Olive)', nij: 'IIIA', material: 'Aramid', weight: 1.5, source: 'Turncoat R.2' },
  { name: 'MICH (Olive)', nij: 'IIIA', material: 'Steel', weight: 1.6, source: 'Handshake R.2' },
  { name: 'FAST Carbon', nij: 'IIIA', material: 'Aramid', weight: 1.1, source: 'Banshee R.2' },
];

const WEAPONS = [
  { name: 'Glock 17', type: 'Pistol', caliber: '9x19mm', magSize: 17, source: 'Gunny R.1' },
  { name: 'Beretta M9A1', type: 'Pistol', caliber: '9x19mm', magSize: 15, source: 'Gunny R.1' },
  { name: 'Colt Combat Commander', type: 'Pistol', caliber: '.45 ACP', magSize: 7, source: 'Gunny R.1' },
  { name: 'Colt 1911', type: 'Pistol', caliber: '.45 ACP', magSize: 7, source: 'Looting' },
  { name: 'Vz. 61 Skorpion', type: 'Pistol', caliber: '7.65mm', magSize: 20, source: 'Gunny R.1' },
  { name: 'Type 51', type: 'Pistol', caliber: '7.62x25mm', magSize: 8, source: 'Turncoat R.2' },
  { name: 'MP5', type: 'SMG', caliber: '9x19mm', magSize: 30, source: 'Gunny R.2' },
  { name: 'MP7A1', type: 'SMG', caliber: '4.6x30mm', magSize: 40, source: 'Gunny R.2' },
  { name: 'MP7A2', type: 'SMG', caliber: '4.6x30mm', magSize: 40, source: 'Looting' },
  { name: 'M4A1', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, fireRate: '700', source: 'Gunny R.2' },
  { name: 'DDM4', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, source: 'Gunny R.2' },
  { name: 'CQ A1', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, source: 'Turncoat R.2' },
  { name: 'AK-19', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, source: 'Looting' },
  { name: 'SIG MCX', type: 'Assault Rifle', caliber: '.300 AAC', magSize: 30, source: 'Gunny R.2' },
  { name: 'AK-74M', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, source: 'Turncoat R.2' },
  { name: 'AK-74N', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, source: 'Looting' },
  { name: 'AK-12', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, fireRate: '700', source: 'Turncoat R.3' },
  { name: 'AKS-74U', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, source: 'Looting' },
  { name: 'AKM', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Turncoat R.2' },
  { name: 'AKMN', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Looting' },
  { name: 'AKMSN', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Looting' },
  { name: 'AK-15', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Turncoat R.3' },
  { name: 'AK-308', type: 'Assault Rifle', caliber: '7.62x51mm', magSize: 20, source: 'Looting' },
  { name: 'SKS', type: 'DMR', caliber: '7.62x39mm', magSize: 10, source: 'Turncoat R.2' },
  { name: 'SVD', type: 'DMR', caliber: '7.62x54R', magSize: 10, source: 'Turncoat R.3' },
  { name: 'M700', type: 'Bolt-Action', caliber: '7.62x51mm', magSize: 5, source: 'Looting' },
  { name: 'Mosin-Nagant', type: 'Bolt-Action', caliber: '7.62x54R', magSize: 5, source: 'Looting' },
  { name: 'Mosin-Nagant (Sniper)', type: 'Bolt-Action', caliber: '7.62x54R', magSize: 5, source: 'Turncoat R.2' },
  { name: 'Remington 788', type: 'Bolt-Action', caliber: '.222 Remington', magSize: 4, source: 'Looting' },
  { name: 'M870', type: 'Shotgun', caliber: '12 Gauge', magSize: 6, source: 'Gunny R.1' },
  { name: 'Mossberg 590', type: 'Shotgun', caliber: '12 Gauge', magSize: 8, source: 'Gunny R.2' },
];

const MISSIONS = [
  { id: 'cache-report-ii', name: 'Cache Report II', vendor: 'Gunny', area: 'North of Fort Narith', type: 'contract' },
  { id: 'cache-report-ix', name: 'Cache Report IX', vendor: 'Gunny', area: 'North of Blue Lagoon', type: 'contract' },
  { id: 'they-are-everywhere', name: 'They Are Everywhere', vendor: 'Gunny', area: 'Blue Lagoon', type: 'contract' },
  { id: 'a-small-favor', name: 'A Small Favor', vendor: 'Turncoat', area: 'Fort Narith' },
  { id: 'artisans-list', name: "Artisan's List", vendor: 'Artisan', area: 'Tiger Bay' },
  { id: 'artisans-list-ii', name: "Artisan's List II", vendor: 'Artisan', area: 'Tiger Bay' },
  { id: 'at-dooms-gate', name: "At Doom's Gate", vendor: 'Handshake', area: 'Lamang Island' },
  { id: 'at-the-mounds-of-madness', name: 'At the Mounds of Madness', vendor: 'Artisan', area: 'Ban pa' },
  { id: 'at-the-mounds-of-madness-ii', name: 'At the Mounds of Madness II', vendor: 'Artisan', area: 'Ban pa' },
  { id: 'aye-aye-captain', name: 'Aye Aye, Captain', vendor: 'Handshake', area: 'Blue Lagoon' },
  { id: 'bad-idea', name: 'Bad Idea', vendor: 'Banshee', area: 'Tiger Bay' },
  { id: 'big-fish', name: 'Big Fish', vendor: 'Handshake', area: 'Blue Lagoon' },
  { id: 'breadcrumbs', name: 'Breadcrumbs', vendor: 'Lab Rat', area: 'Ban Pa' },
  { id: 'business-or-pleasure', name: 'Business or Pleasure', vendor: 'Turncoat', area: 'Fort Narith' },
  { id: 'cache-report-iii', name: 'Cache Report III', vendor: 'Gunny', area: 'Sawmill' },
  { id: 'cache-report-v', name: 'Cache Report V', vendor: 'Gunny', area: 'Midnight Sapphire' },
  { id: 'combat-sweep-iii', name: 'Combat Sweep III', vendor: 'Gunny', area: 'Pha Lang Airfield' },
  { id: 'combat-sweep-v', name: 'Combat Sweep V', vendor: 'Gunny', area: 'Fort Narith' },
  { id: 'combat-sweep-vi', name: 'Combat Sweep VI', vendor: 'Gunny', area: 'Tiger Bay' },
  { id: 'combat-sweep-vii', name: 'Combat Sweep VII', vendor: 'Gunny', area: 'Blue Lagoon' },
  { id: 'combat-sweep-viii', name: 'Combat Sweep VIII', vendor: 'Gunny', area: 'Ban Pa' },
  { id: 'cryptic-signals-ii', name: 'Cryptic Signals II', vendor: 'Lab Rat', area: 'Sawmill' },
  { id: 'cryptic-signals-iii', name: 'Cryptic Signals III', vendor: 'Lab Rat', area: 'Blue Lagoon' },
  { id: 'cryptic-signals-v', name: 'Cryptic Signals V', vendor: 'Lab Rat', area: 'Pha Lang Airfield' },
  { id: 'cryptic-signals-vi', name: 'Cryptic Signals VI', vendor: 'Lab Rat', area: 'Tiger Bay' },
  { id: 'cryptic-signals-viii', name: 'Cryptic Signals VIII', vendor: 'Lab Rat', area: 'Fort Narith' },
  { id: 'cryptic-signals-ix', name: 'Cryptic Signals IX', vendor: 'Lab Rat', area: 'Midnight Sapphire' },
  { id: 'deal-of-the-century', name: 'Deal of the Century', vendor: 'Turncoat', area: 'Fort Narith' },
  { id: 'domesticated-rat', name: 'Domesticated Rat', vendor: 'Lab Rat', area: 'Starting town' },
  { id: 'double-exposure', name: 'Double Exposure', vendor: 'Banshee', area: 'Fort Narith' },
  { id: 'escort', name: 'Escort', vendor: 'Handshake', area: 'Sawmill' },
  { id: 'escort-ii', name: 'Escort II', vendor: 'Handshake', area: 'Fort Narith' },
  { id: 'family-heirloom', name: 'Family Heirloom', vendor: 'Banshee', area: 'Sawmill' },
  { id: 'fire-and-water', name: 'Fire and Water', vendor: 'Handshake', area: 'Pha Lang Airfield' },
  { id: 'fort-narith-stroll', name: 'Fort Narith Stroll', vendor: 'Banshee', area: 'Fort Narith' },
  { id: 'freedom-fighter', name: 'Freedom Fighter', vendor: 'Turncoat', area: 'Tiger Bay' },
  { id: 'fresh-meat', name: 'Fresh Meat', vendor: 'Handshake', area: 'Lamang' },
  { id: 'from-the-sky', name: 'From the Sky', vendor: 'Handshake', area: 'Sawmill' },
  { id: 'hacker', name: 'Hacker', vendor: 'Banshee', area: 'Tiger Bay' },
  { id: 'irrefusable-offer', name: 'Irrefusable Offer', vendor: 'Turncoat', area: 'Tiger Bay' },
  { id: 'livestock', name: 'Livestock', vendor: 'Handshake', area: 'Ban Pa' },
  { id: 'mystery-machines', name: 'Mystery Machines', vendor: 'Lab Rat', area: 'Ban Pa' },
  { id: 'new-neighbors', name: 'New Neighbors', vendor: 'Handshake', area: 'Nam Thaven' },
  { id: 'no-way-up', name: 'No Way Up', vendor: 'Handshake', area: 'Midnight Sapphire' },
  { id: 'radio-star', name: 'Radio Star', vendor: 'Artisan', area: 'Ban Pa' },
  { id: 'schadenfreude', name: 'Schadenfreude', vendor: 'Turncoat', area: 'Sawmill' },
  { id: 'so-close', name: 'So Close', vendor: 'Handshake', area: 'YBL-1' },
  { id: 'sunken-bird', name: 'Sunken Bird', vendor: 'Handshake', area: 'Blue Lagoon' },
  { id: 'supernatural', name: 'Supernatural', vendor: 'Banshee', area: 'Ban Pa' },
  { id: 'the-liberator', name: 'The Liberator', vendor: 'Turncoat', area: 'Fort Narith' },
  { id: 'the-negotiator', name: 'The Negotiator', vendor: 'Handshake', area: 'Fort Narith' },
  { id: 'the-runaway', name: 'The Runaway', vendor: 'Banshee', area: 'Tiger Bay' },
  { id: 'the-shadow-over-ban-pa', name: 'The Shadow over Ban Pa', vendor: 'Lab Rat', area: 'Ban Pa' },
  { id: 'the-stand', name: 'The Stand', vendor: 'Banshee', area: 'Midnight Sapphire' },
  { id: 'unattainable-luxury', name: 'Unattainable Luxury', vendor: 'Turncoat', area: 'Midnight Sapphire' },
  { id: 'unstable-meeting', name: 'Unstable Meeting', vendor: 'Turncoat', area: 'Ban Pa' },
  { id: 'up-the-stream', name: 'Up the Stream', vendor: 'Handshake', area: 'Sawmill' },
];

const RECOMMENDATIONS = [
  { tier: 'T1', label: 'Budget / Early', vest: 'Molle Vest (IIIA)', helmet: 'SS-27 (IIA)', ammo: ['5.56x45mm FMJ / M193', '7.62x39mm PS', '9x19mm FMJ'], notes: 'Good vs AI. Avoid geared PvP.' },
  { tier: 'T2', label: 'Mid Tier', vest: 'SK-S (III) or ATBV (III)', helmet: 'ACH (IIIA)', ammo: ['5.56x45mm AP M855', '5.45x39mm PP 7N10'], notes: 'Can fight players. SK-S is only 3.15kg.' },
  { tier: 'T3', label: 'High Tier', vest: 'CZ 4M Hornet (III+)', helmet: 'FAST Carbon (IIIA)', ammo: ['5.56x45mm AP M855A1', '7.62x51mm AP M61'], notes: 'Ceramic plates stop most rifle rounds.' },
  { tier: 'T4', label: 'End Game', vest: 'LVS Tactical (III++)', helmet: 'FAST Carbon (IIIA)', ammo: ['5.56x45mm AP M995', '7.62x54R AP 7N13'], notes: 'Best in slot. Full coverage.' },
];

// ─── Helpers ───

function etag(payload) {
  return createHash('md5').update(JSON.stringify(payload)).digest('hex');
}

function json(data, code = 200, req) {
  const body = JSON.stringify({
    data,
    meta: {
      count: Array.isArray(data) ? data.length : 1,
      source: 'GZW Tools API',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    },
  }, null, 2);

  const tag = etag(body);
  if (req) {
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch === `"${tag}"`) {
      return new Response(null, { status: 304, headers: { 'ETag': `"${tag}"` } });
    }
  }

  return new Response(body, {
    status: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': CACHE,
      'ETag': `"${tag}"`,
    },
  });
}

function error(msg, code = 400, req) {
  return json({ error: msg, code }, code, req);
}

// ─── Router ───

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, '').replace('/api', '') || '/';
  const method = req.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
  }
  if (method !== 'GET') return error('Method not allowed', 405, req);

  try {
    // ── /api/ — Root / docs ──
    if (path === '/') {
      return json({
        name: 'GZW Tools API',
        description: 'Gray Zone Warfare fan companion data API',
        endpoints: [
          { path: '/api', desc: 'API info & documentation' },
          { path: '/api/ammo?caliber=', desc: 'Ammunition data (optional caliber filter)' },
          { path: '/api/vendors', desc: 'All vendor reputation data' },
          { path: '/api/weapons?type=&caliber=&search=', desc: 'Weapons database with filters' },
          { path: '/api/armor', desc: 'All armor vests and helmets' },
          { path: '/api/armor/vests', desc: 'Vests only' },
          { path: '/api/armor/helmets', desc: 'Helmets only' },
          { path: '/api/recommendations', desc: 'Gear recommendations' },
          { path: '/api/missions?vendor=&area=', desc: 'Mission database with filters' },
          { path: '/api/stats', desc: 'Aggregate stats & counts' },
          { path: '/api/calculator/rep-to-dollars?current=&target=&rate=', desc: 'Rep to dollars calculator' },
          { path: '/api/calculator/missions?current=&target=', desc: 'Mission count calculator' },
          { path: '/api/search?q=', desc: 'Unified search across all data' },
        ],
      }, 200, req);
    }

    // ── /api/ammo ──
    if (path === '/ammo') {
      const caliber = url.searchParams.get('caliber');
      let data = AMMO;
      if (caliber) data = data.filter(a => a.caliber === caliber);
      return json({ rounds: data, calibers: CALIBERS }, 200, req);
    }

    // ── /api/vendors ──
    if (path === '/vendors') {
      return json(VENDORS, 200, req);
    }

    // ── /api/weapons ──
    if (path === '/weapons') {
      let data = WEAPONS;
      const type = url.searchParams.get('type');
      const caliber = url.searchParams.get('caliber');
      const search = url.searchParams.get('search');
      if (type) data = data.filter(w => w.type === type);
      if (caliber) data = data.filter(w => w.caliber === caliber);
      if (search) { const q = search.toLowerCase(); data = data.filter(w => w.name.toLowerCase().includes(q) || w.caliber.includes(q)); }
      return json(data, 200, req);
    }

    // ── /api/armor ──
    if (path === '/armor') {
      return json({ vests: VESTS, helmets: HELMETS }, 200, req);
    }
    if (path === '/armor/vests') return json(VESTS, 200, req);
    if (path === '/armor/helmets') return json(HELMETS, 200, req);

    // ── /api/recommendations ──
    if (path === '/recommendations') {
      return json({ recommendations: RECOMMENDATIONS, vendorGear: [
        { vendor: 'Handshake', rep: 1, items: 'Commander IIIA, LVS Overt IIIA+' },
        { vendor: 'Handshake', rep: 4, items: 'LVS Tactical Multicam III++' },
        { vendor: 'Artisan', rep: 1, items: 'Molle Vest IIIA, SS-27 IIA' },
        { vendor: 'Turncoat', rep: 2, items: 'SK-S III, ATBV III, ACH IIIA' },
        { vendor: 'Banshee', rep: 2, items: 'FAST Carbon IIIA' },
      ] }, 200, req);
    }

    // ── /api/missions ── (NEW)
    if (path === '/missions') {
      let data = MISSIONS;
      const vendor = url.searchParams.get('vendor');
      const area = url.searchParams.get('area');
      const search = url.searchParams.get('search');
      if (vendor) data = data.filter(m => m.vendor?.toLowerCase() === vendor.toLowerCase());
      if (area) data = data.filter(m => m.area?.toLowerCase().includes(area.toLowerCase()));
      if (search) { const q = search.toLowerCase(); data = data.filter(m => m.name.toLowerCase().includes(q) || (m.area || '').toLowerCase().includes(q)); }
      return json(data, 200, req);
    }

    // ── /api/stats ── (NEW)
    if (path === '/stats') {
      return json({
        weapons: { total: WEAPONS.length, types: [...new Set(WEAPONS.map(w => w.type))] },
        ammo: { total: AMMO.length, calibers: CALIBERS },
        armor: { vests: VESTS.length, helmets: HELMETS.length },
        vendors: { total: VENDORS.length, list: VENDORS.map(v => ({ name: v.name, rep: v.currentRep, maxRep: v.maxRep })) },
        missions: { total: MISSIONS.length, vendors: [...new Set(MISSIONS.map(m => m.vendor).filter(Boolean))] },
        totalRep: VENDORS.reduce((a, v) => a + v.currentRep, 0),
        maxTotalRep: VENDORS.reduce((a, v) => a + v.maxRep, 0),
        avgProgress: Math.round(VENDORS.reduce((a, v) => a + (v.currentRep / v.maxRep) * 100, 0) / VENDORS.length),
      }, 200, req);
    }

    // ── /api/calculator/rep-to-dollars ── (NEW)
    if (path === '/calculator/rep-to-dollars') {
      const current = parseInt(url.searchParams.get('current')) || 0;
      const target = parseInt(url.searchParams.get('target')) || 13000;
      const rate = parseInt(url.searchParams.get('rate')) || 100;
      const diff = Math.max(0, target - current);
      return json({
        current, target, diff, rate,
        cost: diff * rate,
        progressPct: Math.min((current / target) * 100, 100),
        progressAfterPct: Math.min((target / target) * 100, 100),
      }, 200, req);
    }

    // ── /api/calculator/missions ── (NEW)
    if (path === '/calculator/missions') {
      const current = parseInt(url.searchParams.get('current')) || 0;
      const target = parseInt(url.searchParams.get('target')) || 13000;
      const missionTypes = [
        { name: 'Task Mission', rep: 25 },
        { name: 'Supply Run', rep: 50 },
        { name: 'Recon Mission', rep: 75 },
        { name: 'Elimination', rep: 100 },
        { name: 'Elite Task', rep: 150 },
        { name: 'Critical Op', rep: 200 },
      ];
      const needed = Math.max(0, target - current);
      const sorted = [...missionTypes].sort((a, b) => b.rep - a.rep);
      const results = [];
      let remaining = needed;
      for (const m of sorted) {
        if (remaining <= 0) break;
        const count = Math.floor(remaining / m.rep);
        if (count > 0) { results.push({ type: m.name, repEach: m.rep, count }); remaining -= count * m.rep; }
      }
      if (remaining > 0 && missionTypes.length > 0) {
        const smallest = [...missionTypes].sort((a, b) => a.rep - b.rep)[0];
        const existing = results.find(r => r.type === smallest.name);
        if (existing) existing.count += 1; else results.push({ type: smallest.name, repEach: smallest.rep, count: 1 });
      }
      return json({ current, target, needed, totalMissions: results.reduce((a, r) => a + r.count, 0), breakdown: results }, 200, req);
    }

    // ── /api/search ── (NEW)
    if (path === '/search') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      if (!q) return error('Query parameter "q" is required', 400, req);

      const weap = WEAPONS.filter(w => w.name.toLowerCase().includes(q) || w.caliber.includes(q)).slice(0, 10);
      const ammo = AMMO.filter(a => a.name.toLowerCase().includes(q) || a.caliber.includes(q)).slice(0, 10);
      const vest = VESTS.filter(v => v.name.toLowerCase().includes(q)).slice(0, 5);
      const hel = HELMETS.filter(h => h.name.toLowerCase().includes(q)).slice(0, 5);
      const miss = MISSIONS.filter(m => m.name.toLowerCase().includes(q) || (m.area || '').toLowerCase().includes(q) || (m.vendor || '').toLowerCase().includes(q)).slice(0, 10);

      return json({ query: q, weapons: weap, ammo, vests: vest, helmets: hel, missions: miss }, 200, req);
    }

    return error('Not found', 404, req);
  } catch (e) {
    return error('Internal error: ' + e.message, 500, req);
  }
}

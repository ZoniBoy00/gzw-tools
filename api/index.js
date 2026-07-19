// GZW Tools API v1 — Single handler for all endpoints
// Plain JavaScript to avoid Vercel TypeScript compilation issues

const CACHE = 'public, max-age=3600, s-maxage=3600';

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
  { caliber: '5.56x45mm', name: 'AP (M855)', speed: 920, accMod: 2, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '5.56x45mm', name: 'AP (M855A1)', speed: 970, accMod: 7, durMod: -40, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '5.56x45mm', name: 'AP (M995)', speed: 1030, accMod: 5, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 } },
  { caliber: '5.45x39mm', name: 'FMJ', speed: 855, accMod: 0, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 1, III: 0, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '5.45x39mm', name: 'BP (7N22)', speed: 860, accMod: 1, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '7.62x39mm', name: 'PS (57-N-231C)', speed: 725, accMod: 1, durMod: -15, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 1, 'III++': 0 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '7.62x39mm', name: 'BP (7N23)', speed: 740, accMod: 2, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 1 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '7.62x51mm', name: 'AP (M61)', speed: 838, accMod: 4, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
  { caliber: '7.62x54R', name: 'AP (7N13)', speed: 828, accMod: 2, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 } },
  { caliber: '9x19mm', name: 'FMJ', speed: 390, accMod: 0, durMod: 0, pen: { I: 2, IIA: 1, 'IIA+': 0, IIIA: 0, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 1 },
  { caliber: '9x19mm', name: 'Xtreme Penetrator P+', speed: 381, accMod: 2, durMod: 0, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 1, 'IIIA+': 0, III: 0, 'III+': 0, 'III++': 0 }, vendor: 'Gunny', repLevel: 2 },
  { caliber: '.300 AAC', name: 'AP', speed: 725, accMod: 4, durMod: -100, pen: { I: 2, IIA: 2, 'IIA+': 2, IIIA: 2, 'IIIA+': 2, III: 2, 'III+': 2, 'III++': 2 }, vendor: 'Gunny', repLevel: 3 },
];

const CALIBERS = [...new Set(AMMO.map(a => a.caliber))];

const VESTS = [
  { name: 'Coolmax Covert Vest', nij: 'IIIA', material: 'Aramid', plates: 'Front, Back', grid: '3×3', weight: 1.76, source: 'Looting' },
  { name: 'Commander (Black/Navy/Olive)', nij: 'IIIA', material: 'Aramid', plates: 'Front, Back', grid: '3×3', weight: 2.45, source: 'Handshake R.1' },
  { name: 'Molle Vest', nij: 'IIIA', material: 'Steel', plates: 'Front', grid: '3×3', weight: 2.6, source: 'Artisan R.1' },
  { name: 'SK-S Ballistic Vest', nij: 'III', material: 'UHMWPE', plates: 'Front, Back', grid: '3×3', weight: 3.15, source: 'Turncoat R.2' },
  { name: 'ATBV Vest', nij: 'III', material: 'UHMWPE', plates: 'Front, Back', grid: '3×3', weight: 3.8, source: 'Turncoat R.2' },
  { name: 'CZ 4M Hornet (UNLRA)', nij: 'III', material: 'Ceramic', plates: 'Front, Back', grid: '3×3', weight: 6.45, source: 'Looting' },
  { name: 'LVS Tactical (Multicam)', nij: 'III++', material: 'Ceramic', plates: 'Front, Back, Sides', grid: '3×3', weight: 8.2, source: 'Handshake R.4' },
];

const HELMETS = [
  { name: 'SS-27 (Black)', nij: 'IIA', material: 'Aramid', weight: 1.3, source: 'Artisan R.1' },
  { name: 'ACH (Olive)', nij: 'IIIA', material: 'Aramid', weight: 1.5, source: 'Turncoat R.2' },
  { name: 'FAST Carbon', nij: 'IIIA', material: 'Aramid', weight: 1.1, source: 'Banshee R.2' },
];

const WEAPONS = [
  { name: 'Glock 17', type: 'Pistol', caliber: '9x19mm', magSize: 17, source: 'Gunny R.1' },
  { name: 'MP5', type: 'SMG', caliber: '9x19mm', magSize: 30, source: 'Gunny R.2' },
  { name: 'M4A1', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, source: 'Gunny R.2' },
  { name: 'AK-74M', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, source: 'Turncoat R.2' },
  { name: 'AKM', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Turncoat R.2' },
  { name: 'SIG MCX', type: 'Assault Rifle', caliber: '.300 AAC', magSize: 30, source: 'Gunny R.2' },
  { name: 'SVD', type: 'DMR', caliber: '7.62x54R', magSize: 10, source: 'Turncoat R.3' },
  { name: 'M700', type: 'Bolt-Action', caliber: '7.62x51mm', magSize: 5, source: 'Looting' },
  { name: 'M870', type: 'Shotgun', caliber: '12 Gauge', magSize: 6, source: 'Gunny R.1' },
];

// ─── Helpers ───

function json(data, code = 200) {
  return new Response(JSON.stringify({
    data,
    count: Array.isArray(data) ? data.length : 1,
    source: 'GZW Tools API',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': CACHE,
    },
  });
}

function error(msg, code = 400) {
  return json({ error: msg, code }, code);
}

// ─── Router ───

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, '').replace('/api', '') || '/';
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
    });
  }

  if (method !== 'GET') return error('Method not allowed', 405);

  const ts = new Date().toISOString();

  try {
    // /api/ — docs
    if (path === '/') {
      return json({
        name: 'GZW Tools API',
        version: '1.0.0',
        endpoints: [
          '/api/ammo?caliber=5.56x45mm',
          '/api/vendors',
          '/api/weapons?type=Assault%20Rifle',
          '/api/armor',
          '/api/armor/vests',
          '/api/armor/helmets',
          '/api/recommendations',
        ],
      });
    }

    // /api/ammo
    if (path === '/ammo') {
      const caliber = url.searchParams.get('caliber');
      let data = AMMO;
      if (caliber) data = data.filter(a => a.caliber === caliber);
      return json({ ...data, calibers: CALIBERS });
    }

    // /api/vendors
    if (path === '/vendors') {
      return json(VENDORS);
    }

    // /api/weapons
    if (path === '/weapons') {
      let data = WEAPONS;
      const type = url.searchParams.get('type');
      const caliber = url.searchParams.get('caliber');
      const search = url.searchParams.get('search');
      if (type) data = data.filter(w => w.type === type);
      if (caliber) data = data.filter(w => w.caliber === caliber);
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(w => w.name.toLowerCase().includes(q) || w.caliber.includes(q));
      }
      return json(data);
    }

    // /api/armor
    if (path === '/armor') {
      return json({ vests: VESTS, helmets: HELMETS });
    }

    // /api/armor/vests
    if (path === '/armor/vests') {
      return json(VESTS);
    }

    // /api/armor/helmets
    if (path === '/armor/helmets') {
      return json(HELMETS);
    }

    // /api/recommendations
    if (path === '/recommendations') {
      return json({
        recommendations: [
          { tier: 'T1', label: 'Budget', vest: 'Molle Vest IIIA', helmet: 'SS-27 IIA', ammo: 'FMJ / M193', notes: 'Good vs AI' },
          { tier: 'T2', label: 'Mid', vest: 'SK-S III', helmet: 'ACH IIIA', ammo: 'AP M855 / BP 7N22', notes: 'Can fight players' },
          { tier: 'T3', label: 'High', vest: 'CZ Hornet III+', helmet: 'FAST Carbon IIIA', ammo: 'AP M855A1 / M61', notes: 'Ceramic plates' },
          { tier: 'T4', label: 'End Game', vest: 'LVS Tactical III++', helmet: 'FAST Carbon IIIA', ammo: 'AP M995 / M61', notes: 'Best in slot' },
        ],
        vendorGear: [
          { vendor: 'Handshake', rep: 1, items: 'Commander IIIA, LVS Overt IIIA+' },
          { vendor: 'Handshake', rep: 4, items: 'LVS Tactical III++ (best)' },
          { vendor: 'Artisan', rep: 1, items: 'Molle Vest IIIA, SS-27 IIA' },
          { vendor: 'Turncoat', rep: 2, items: 'SK-S III, ATBV III, ACH IIIA' },
          { vendor: 'Banshee', rep: 2, items: 'FAST Carbon IIIA' },
        ],
      });
    }

    return error('Not found', 404);
  } catch (e) {
    return error('Internal error: ' + e.message, 500);
  }
}

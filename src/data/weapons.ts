import type { WeaponEntry } from './types';

export const WEAPONS: WeaponEntry[] = [
  // ─── Pistols ───
  { name: 'Glock 17', type: 'Pistol', caliber: '9x19mm', magSize: 17, source: 'Gunny R.1 / Looting' },
  { name: 'Beretta M9A1', type: 'Pistol', caliber: '9x19mm', magSize: 15, source: 'Gunny R.1 / Looting' },
  { name: 'Colt Combat Commander', type: 'Pistol', caliber: '.45 ACP', magSize: 7, source: 'Gunny R.1 / Looting' },
  { name: 'Colt 1911', type: 'Pistol', caliber: '.45 ACP', magSize: 7, source: 'Looting' },
  { name: 'Vz. 61 Skorpion', type: 'Pistol', caliber: '7.65mm', magSize: 20, source: 'Gunny R.1' },
  { name: 'Type 51', type: 'Pistol', caliber: '7.62x25mm', magSize: 8, source: 'Turncoat R.2' },

  // ─── SMGs ───
  { name: 'MP5', type: 'SMG', caliber: '9x19mm', magSize: 30, source: 'Gunny R.2 / Looting' },
  { name: 'MP7A1', type: 'SMG', caliber: '4.6x30mm', magSize: 40, source: 'Gunny R.2 / Looting' },
  { name: 'MP7A2', type: 'SMG', caliber: '4.6x30mm', magSize: 40, source: 'Looting' },

  // ─── Assault Rifles ───
  { name: 'M4A1', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, fireRate: '700', source: 'Gunny R.2 / Looting' },
  { name: 'DDM4', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, source: 'Gunny R.2 / Looting' },
  { name: 'CQ A1', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, source: 'Turncoat R.2 / Looting' },
  { name: 'AK-19', type: 'Assault Rifle', caliber: '5.56x45mm', magSize: 30, source: 'Looting' },
  { name: 'SIG MCX', type: 'Assault Rifle', caliber: '.300 AAC', magSize: 30, source: 'Gunny R.2 / Looting' },
  { name: 'AK-74M', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, source: 'Turncoat R.2 / Looting' },
  { name: 'AK-74N', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, source: 'Looting' },
  { name: 'AK-12', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, fireRate: '700', source: 'Turncoat R.3 / Looting' },
  { name: 'AKS-74U', type: 'Assault Rifle', caliber: '5.45x39mm', magSize: 30, source: 'Looting' },
  { name: 'AKM', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Turncoat R.2 / Looting' },
  { name: 'AKMN', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Looting' },
  { name: 'AKMSN', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Looting' },
  { name: 'AK-15', type: 'Assault Rifle', caliber: '7.62x39mm', magSize: 30, source: 'Turncoat R.3 / Looting' },
  { name: 'AK-308', type: 'Assault Rifle', caliber: '7.62x51mm', magSize: 20, source: 'Looting' },

  // ─── DMRs / Sniper ───
  { name: 'SKS', type: 'DMR', caliber: '7.62x39mm', magSize: 10, source: 'Turncoat R.2 / Looting' },
  { name: 'SVD', type: 'DMR', caliber: '7.62x54R', magSize: 10, source: 'Turncoat R.3 / Looting' },
  { name: 'M700', type: 'Bolt-Action', caliber: '7.62x51mm', magSize: 5, source: 'Looting' },
  { name: 'Mosin-Nagant', type: 'Bolt-Action', caliber: '7.62x54R', magSize: 5, source: 'Looting' },
  { name: 'Mosin-Nagant (Sniper)', type: 'Bolt-Action', caliber: '7.62x54R', magSize: 5, source: 'Turncoat R.2' },
  { name: 'Remington 788', type: 'Bolt-Action', caliber: '.222 Remington', magSize: 4, source: 'Looting' },

  // ─── Shotguns ───
  { name: 'M870', type: 'Shotgun', caliber: '12 Gauge', magSize: 6, source: 'Gunny R.1' },
  { name: 'Mossberg 590', type: 'Shotgun', caliber: '12 Gauge', magSize: 8, source: 'Gunny R.2' },
];

export const WEAPON_TYPES = Array.from(new Set(WEAPONS.map((w) => w.type)));
export const WEAPON_CALIBERS = Array.from(new Set(WEAPONS.map((w) => w.caliber)));

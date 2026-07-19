// Vendor-specific items not covered by weapons/ammo/armor datasets.
// These include medical supplies (Lab Rat), starter gear (Handshake),
// and other vendor inventories that exist only as images on the wiki.
//
// TODO: When the wiki gets text-based vendor tables, migrate these to
// the scraper. For now, these are manually maintained based on game data.

export interface VendorSoldItem {
  name: string;
  type: 'medical' | 'gear' | 'attachment' | 'weapon' | 'ammo' | 'vest' | 'helmet' | 'container' | 'tool';
  vendor: string;
  repLevel: number;
  detail: string;
}

/** Items sold by non-weapon/armor vendor inventories. */
export const VENDOR_ITEMS: VendorSoldItem[] = [
  // ─── Handshake — Starter Weapons & Gear ───
  // Weapons come from weapons.json with corrected source field.
  // Only non-weapon items (armor, gear) are listed here.
  { vendor: 'Handshake', repLevel: 1, name: 'Commander IIIA', type: 'vest', detail: 'IIIA-rated body armor — basic protection' },
  { vendor: 'Handshake', repLevel: 1, name: 'LVS Overt IIIA+', type: 'vest', detail: 'IIIA+-rated body armor — improved coverage' },
  { vendor: 'Handshake', repLevel: 1, name: 'MICH IIA', type: 'helmet', detail: 'IIA-rated ballistic helmet' },
  { vendor: 'Handshake', repLevel: 1, name: 'SS-27 IIA', type: 'helmet', detail: 'IIA-rated lightweight helmet' },
  { vendor: 'Handshake', repLevel: 2, name: 'Covert Woodland III', type: 'vest', detail: 'III-rated covert vest — woodland camo' },
  { vendor: 'Handshake', repLevel: 2, name: 'LVS Tactical III', type: 'vest', detail: 'III-rated tactical vest' },
  { vendor: 'Handshake', repLevel: 3, name: 'CZ 4M Hornet Green III+', type: 'vest', detail: 'III+-rated plate carrier — green' },
  { vendor: 'Handshake', repLevel: 4, name: 'LVS Tactical Multicam III++', type: 'vest', detail: 'III++-rated tactical vest — multicam' },

  // ─── Lab Rat — Medical Supplies ───
  { vendor: 'Lab Rat', repLevel: 1, name: 'Basic Surgical Kit', type: 'medical', detail: 'Surgery kit — wound repair equipment' },
  { vendor: 'Lab Rat', repLevel: 1, name: 'Suture Kit', type: 'medical', detail: 'Wound closure kit' },
  { vendor: 'Lab Rat', repLevel: 1, name: 'Small Blood Bag', type: 'medical', detail: 'Blood transfusion — restores blood volume' },
  { vendor: 'Lab Rat', repLevel: 1, name: 'Combat Bandage', type: 'medical', detail: 'Basic wound dressing' },
  { vendor: 'Lab Rat', repLevel: 1, name: 'Splint', type: 'medical', detail: 'Fracture immobilization — stabilizes broken bones' },
  { vendor: 'Lab Rat', repLevel: 2, name: 'EPO V2', type: 'medical', detail: 'Performance enhancer — improves stamina regeneration' },
  { vendor: 'Lab Rat', repLevel: 2, name: 'ORI-12 V2', type: 'medical', detail: 'Regenerative compound — accelerated healing' },
  { vendor: 'Lab Rat', repLevel: 2, name: 'Meloxicam', type: 'medical', detail: 'Pain relief medication — reduces pain effects' },
  { vendor: 'Lab Rat', repLevel: 2, name: 'Combat Tourniquet', type: 'medical', detail: 'Hemorrhage control — stops heavy bleeding' },
  { vendor: 'Lab Rat', repLevel: 2, name: 'Activated Charcoal', type: 'medical', detail: 'Toxin absorption — counters poisoning' },
  { vendor: 'Lab Rat', repLevel: 3, name: 'Large Blood Bag', type: 'medical', detail: 'Extended blood transfusion — restores more blood volume' },
  { vendor: 'Lab Rat', repLevel: 3, name: 'Fenethylline', type: 'medical', detail: 'Cognitive stimulant — reduces tremor, improves focus' },
  { vendor: 'Lab Rat', repLevel: 3, name: 'Strychnine', type: 'medical', detail: 'Toxic compound — high-risk chemical agent' },
  { vendor: 'Lab Rat', repLevel: 4, name: 'HpR 3-S', type: 'medical', detail: 'Advanced surgical kit — tier 3 surgery supplies' },
  { vendor: 'Lab Rat', repLevel: 4, name: 'Combat Medic Pack', type: 'medical', detail: 'Advanced medical kit — full trauma treatment' },

  // ─── Artisan — Attachments and Gear ───
  // Artisan sells weapon attachments, parts, and containers.
  // The wiki shows these only as images — items below are the known unlocks.
  { vendor: 'Artisan', repLevel: 1, name: 'Molle Vest IIIA', type: 'vest', detail: 'IIIA-rated MOLLE vest' },
  { vendor: 'Artisan', repLevel: 1, name: 'SS-27 IIA', type: 'helmet', detail: 'IIA-rated lightweight helmet' },
  { vendor: 'Artisan', repLevel: 2, name: 'Weapon Attachments', type: 'attachment', detail: 'Various sights, grips and muzzles' },
  { vendor: 'Artisan', repLevel: 3, name: 'Advanced Attachments', type: 'attachment', detail: 'Tier 2 weapon mods' },
  { vendor: 'Artisan', repLevel: 4, name: 'Premium Attachments', type: 'attachment', detail: 'High-tier weapon parts and containers' },

  // ─── Turncoat — Armor & Gear ───
  { vendor: 'Turncoat', repLevel: 2, name: 'SK-S III', type: 'vest', detail: 'III-rated plate carrier — lightweight' },
  { vendor: 'Turncoat', repLevel: 2, name: 'ATBV III', type: 'vest', detail: 'III-rated tactical vest' },
  { vendor: 'Turncoat', repLevel: 2, name: 'ACH IIIA', type: 'helmet', detail: 'IIIA-rated advanced combat helmet' },
  { vendor: 'Turncoat', repLevel: 3, name: '6B23-1 III+', type: 'vest', detail: 'III+-rated steel plate vest' },

  // ─── Banshee — High-Tier Armor & Gear ───
  // Banshee sells weapons, armor, attachments and gear at high rep levels.
  { vendor: 'Banshee', repLevel: 2, name: 'FAST Carbon IIIA', type: 'helmet', detail: 'IIIA-rated carbon composite FAST helmet' },
  { vendor: 'Banshee', repLevel: 3, name: 'High-Tier Armor', type: 'vest', detail: 'Advanced armor plates and vests' },
  { vendor: 'Banshee', repLevel: 4, name: 'Premium Gear', type: 'gear', detail: 'High-end attachments and equipment' },

  // ─── Vulture — Roaming Trader ───
  // Vulture roams Major COPs weekly, accepts valuables as currency.
  // Items rotate and change — these are examples of what he may offer.
  { vendor: 'Vulture', repLevel: 1, name: 'Weapon Parts', type: 'gear', detail: 'Basic weapon repair and mod parts' },
  { vendor: 'Vulture', repLevel: 2, name: 'Special Ammo', type: 'ammo', detail: 'Rare ammunition types' },
  { vendor: 'Vulture', repLevel: 2, name: 'Unique Weapon Parts', type: 'attachment', detail: 'Rare attachment variants' },
  { vendor: 'Vulture', repLevel: 3, name: 'Premium Weapon Parts', type: 'gear', detail: 'High-tier weapon modification parts' },
];

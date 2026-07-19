// Gray Zone Warfare — Types

export type ArmorClass = 'I' | 'IIA' | 'IIA+' | 'IIIA' | 'IIIA+' | 'III' | 'III+' | 'III++';
export type PenLevel = 0 | 1 | 2;

export interface AmmoRound {
  name: string;
  caliber: string;
  speed: number;
  accMod: number;
  durMod: number;
  subsonic?: boolean;
  tracer?: boolean;
  pen: Record<ArmorClass, PenLevel>;
  source?: string;
  vendor?: string;
  repLevel?: number;
}

export interface ArmorVest {
  name: string;
  nij: string;
  material: string;
  plates: string;
  grid: string;
  weight: number;
  source: string;
}

export interface Helmet {
  name: string;
  nij: string;
  material: string;
  weight: number;
  source: string;
}

export interface GearRecommendation {
  tier: string;
  label: string;
  vest: string;
  helmet: string;
  ammo: string[];
  notes: string;
}

export interface VendorGearItem {
  vendor: string;
  rep: number;
  items: string;
}

export interface WeaponEntry {
  name: string;
  type: string;
  caliber: string;
  magSize: number;
  fireRate?: string;
  source: string;
}

export const ARMOR_CLASSES: ArmorClass[] = ['I', 'IIA', 'IIA+', 'IIIA', 'IIIA+', 'III', 'III+', 'III++'];

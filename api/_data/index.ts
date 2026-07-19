// Re-export data from src for the API functions
// Vercel serverless functions resolve these paths at build time
export { AMMO, CALIBERS } from '../../src/data/ammo/index';
export { VESTS, HELMETS, RECOMMENDATIONS, VENDOR_GEAR, MATERIAL_RANK } from '../../src/data/armor/index';
export { WEAPONS, WEAPON_TYPES, WEAPON_CALIBERS } from '../../src/data/weapons';
export type {
  AmmoRound, ArmorVest, Helmet, WeaponEntry,
  GearRecommendation, VendorGearItem,
  ApiResponse, ApiError, ArmorClass, PenLevel,
} from './types';

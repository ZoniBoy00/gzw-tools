// Auto-generated from scraper. Do not edit manually.
import type { WeaponEntry } from "./types";
import data from "./weapons.json" with { type: "json" };
export const WEAPONS = data as WeaponEntry[];
export const WEAPON_TYPES = [...new Set(WEAPONS.map((w) => w.type))] as string[];
export const WEAPON_CALIBERS = [...new Set(WEAPONS.map((w) => w.caliber))] as string[];

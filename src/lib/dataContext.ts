import { createContext, useContext } from 'react';
import type { AmmoRound, ArmorVest, Helmet, WeaponEntry } from '../data/types';
import type { KeyEntry, RegionEntry, BossEntry } from './api';

export interface GameData {
  weapons: WeaponEntry[];
  ammo: AmmoRound[];
  calibers: string[];
  vests: ArmorVest[];
  plateCarriers: ArmorVest[];
  helmets: Helmet[];
  keys: KeyEntry[];
  regions: RegionEntry[];
  bosses: BossEntry[];
  worldGuideError: string | null;
  itemImages: Record<string, string>;
  vendorImages: Record<string, string>;
  loading: boolean;
  error: string | null;
  dataVersion: string | null;
}

export const defaultData: GameData = {
  weapons: [],
  ammo: [],
  calibers: [],
  vests: [],
  plateCarriers: [],
  helmets: [],
  keys: [],
  regions: [],
  bosses: [],
  worldGuideError: null,
  itemImages: {},
  vendorImages: {},
  loading: true,
  error: null,
  dataVersion: null,
};

export const DataContext = createContext<GameData>(defaultData);

export function useDataContext() {
  return useContext(DataContext);
}

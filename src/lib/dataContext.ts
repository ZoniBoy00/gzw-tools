import { createContext, useContext } from 'react';
import type { AmmoRound, ArmorVest, Helmet, WeaponEntry } from '../data/types';
import type { KeyEntry } from './api';

export interface GameData {
  weapons: WeaponEntry[];
  ammo: AmmoRound[];
  calibers: string[];
  vests: ArmorVest[];
  helmets: Helmet[];
  keys: KeyEntry[];
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
  helmets: [],
  keys: [],
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

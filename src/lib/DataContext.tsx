/**
 * DataContext — loads ALL game data from gzw-data API at app startup.
 * Components use `useDataContext()` to access any dataset synchronously.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchWeapons, fetchAmmo, fetchVests, fetchHelmets, fetchKeys, fetchItemImages, fetchVendorImages, type KeyEntry } from './api';
import type { AmmoRound, ArmorVest, Helmet, WeaponEntry } from '../data/types';

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
}

const defaultData: GameData = {
  weapons: [], ammo: [], calibers: [], vests: [], helmets: [],
  keys: [], itemImages: {}, vendorImages: {}, loading: true, error: null,
};

const DataContext = createContext<GameData>(defaultData);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GameData>(defaultData);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchWeapons(),
      fetchAmmo(),
      fetchVests(),
      fetchHelmets(),
      fetchKeys(),
      fetchItemImages(),
      fetchVendorImages(),
    ])
      .then(([weapons, ammoData, vests, helmets, keys, itemImages, vendorImages]) => {
        if (cancelled) return;
        setData({
          weapons, vests, helmets, keys, itemImages, vendorImages,
          ammo: ammoData.rounds,
          calibers: ammoData.calibers,
          loading: false,
          error: null,
        });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setData(prev => ({ ...prev, loading: false, error: e.message }));
      });
    return () => { cancelled = true; };
  }, []);

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  return useContext(DataContext);
}

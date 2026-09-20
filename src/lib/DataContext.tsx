/**
 * DataContext — loads ALL game data from gzw-data API at app startup.
 * Components use `useDataContext()` to access any dataset synchronously.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { fetchWeapons, fetchAmmo, fetchVests, fetchHelmets, fetchKeys, fetchItemImages, fetchDataVersion } from './api';
import { DataContext, defaultData, type GameData } from './dataContext';

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
      fetchDataVersion().catch(() => null),
    ])
    .then(([weapons, ammoData, vests, helmets, keys, itemImages, dataVersion]) => {
        if (cancelled) return;
        setData({
          weapons, vests, helmets, keys, itemImages, vendorImages: itemImages,
          ammo: ammoData.rounds,
          calibers: ammoData.calibers,
          loading: false,
          error: null,
          dataVersion,
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


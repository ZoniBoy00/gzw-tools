/**
 * DataContext — loads ALL game data from gzw-data API at app startup.
 * Components use `useDataContext()` to access any dataset synchronously.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { fetchWeapons, fetchAmmo, fetchVests, fetchPlateCarriers, fetchHelmets, fetchKeys, fetchItemImages, fetchDataVersion, fetchRegions, fetchBosses, type RegionEntry, type BossEntry } from './api';
import { DataContext, defaultData, type GameData } from './dataContext';

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GameData>(defaultData);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchWeapons(),
      fetchAmmo(),
      fetchVests(),
      fetchPlateCarriers(),
      fetchHelmets(),
      fetchKeys(),
      fetchItemImages(),
      fetchRegions()
        .then(data => ({ data, error: null as string | null }))
        .catch((e: Error) => ({ data: [] as RegionEntry[], error: e.message })),
      fetchBosses()
        .then(data => ({ data, error: null as string | null }))
        .catch((e: Error) => ({ data: [] as BossEntry[], error: e.message })),
      fetchDataVersion().catch(() => null),
    ])
    .then(([weapons, ammoData, vests, plateCarriers, helmets, keys, itemImages, regionsResult, bossesResult, dataVersion]) => {
        if (cancelled) return;
        setData({
          weapons, vests, plateCarriers, helmets, keys, itemImages, vendorImages: itemImages,
          regions: regionsResult.data,
          bosses: bossesResult.data,
          worldGuideError: [regionsResult.error, bossesResult.error].filter(Boolean).join(' · ') || null,
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


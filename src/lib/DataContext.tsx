import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { fetchWeapons, fetchAmmo, fetchVests, fetchPlateCarriers, fetchHelmets, fetchKeys, fetchItemImages, fetchDataVersion, fetchRegions, fetchBosses } from './api';
import { DataContext, defaultData, type GameData } from './dataContextValue';
import { loadDatasets } from './loadDatasets';

type DatasetPatch = Partial<GameData>;
const loaders: Record<string, () => Promise<DatasetPatch>> = {
  weapons: async () => ({ weapons: await fetchWeapons() }),
  ammo: async () => { const value = await fetchAmmo(); return { ammo: value.rounds, calibers: value.calibers }; },
  vests: async () => ({ vests: await fetchVests() }),
  plateCarriers: async () => ({ plateCarriers: await fetchPlateCarriers() }),
  helmets: async () => ({ helmets: await fetchHelmets() }),
  keys: async () => ({ keys: await fetchKeys() }),
  images: async () => { const images = await fetchItemImages(); return { itemImages: images, vendorImages: images }; },
  regions: async () => ({ regions: await fetchRegions() }),
  bosses: async () => ({ bosses: await fetchBosses() }),
  version: async () => ({ dataVersion: await fetchDataVersion() }),
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GameData>(defaultData);
  const [attempt, setAttempt] = useState(0);
  const failures = useRef<Record<string, string>>({});
  const busy = useRef(false);
  const retryFailed = useCallback(() => {
    if (busy.current || !Object.keys(failures.current).length) return;
    busy.current = true;
    setData(previous => ({ ...previous, retrying: true }));
    setAttempt(value => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    busy.current = true;
    const selected = attempt === 0 ? loaders : Object.fromEntries(
      Object.keys(failures.current).map(name => [name, loaders[name]]),
    );
    void loadDatasets(selected, (name, patch) => {
      if (cancelled) return;
      delete failures.current[name];
      setData(previous => ({ ...previous, ...patch, loading: false, datasetErrors: { ...failures.current } }));
    }, (name, message) => {
      if (cancelled) return;
      failures.current[name] = message;
      setData(previous => ({ ...previous, datasetErrors: { ...failures.current } }));
    }).then(() => {
      if (cancelled) return;
      busy.current = false;
      setData(previous => ({ ...previous, loading: false, retrying: false }));
    });
    return () => { cancelled = true; };
  }, [attempt]);

  return <DataContext.Provider value={{ ...data, retryFailed }}>{children}</DataContext.Provider>;
}

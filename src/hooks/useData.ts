/**
 * Universal data hook — fetches from gzw-data API.
 * Handles loading/error states and response caching.
 */
import { useState, useEffect } from 'react';

interface UseDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Simple in-memory cache for loaded data
const cache = new Map<string, unknown>();

export function useData<T>(key: string, fetcher: () => Promise<T>, deps: string[] = []): UseDataResult<T> {
  const [data, setData] = useState<T>([] as unknown as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const cacheKey = key + JSON.stringify(deps);

  useEffect(() => {
    let cancelled = false;

    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey) as T);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (cancelled) return;
        cache.set(cacheKey, result);
        setData(result);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [cacheKey, version]);

  const refetch = () => {
    cache.delete(cacheKey);
    setVersion(v => v + 1);
  };

  return { data, loading, error, refetch };
}

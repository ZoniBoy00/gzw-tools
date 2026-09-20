import { useState, useEffect } from 'react';

const API = (import.meta.env.VITE_GZW_DATA_URL || 'https://gzw-data.dev/api/v1').replace(/\/$/, '');

export function useApiData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    fetch(`${API}/${endpoint}`, { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        const items = Array.isArray(d) ? d : (d?.data || []);
        setData(items);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled && e.name !== 'AbortError') {
          setError(e instanceof Error ? e.message : 'Failed to load data');
          setLoading(false);
        }
      });
    return () => { cancelled = true; controller.abort(); };
  }, [endpoint, reload]);

  return { data, loading, error, refetch: () => setReload(value => value + 1) };
}

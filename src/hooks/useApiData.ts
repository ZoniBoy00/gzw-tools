import { useState, useEffect } from 'react';

const API = 'https://gzw-data.vercel.app/api';

export function useApiData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API}/${endpoint}`)
      .then(r => r.json())
      .then((d) => {
        if (cancelled) return;
        const items = Array.isArray(d) ? d : (d?.data || []);
        setData(items);
        setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [endpoint]);

  return { data, loading, error, refetch: () => {} };
}

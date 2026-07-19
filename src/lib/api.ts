import { useState, useEffect } from 'react';

const API_BASE = '/api';

export function useApi<T>(endpoint: string, fallback: T): { data: T; loading: boolean; error: string | null } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json.data ?? json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'API error');
          setLoading(false);
          // Fallback is already the initial data
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [endpoint]);

  return { data, loading, error };
}

export function apiUrl(path: string, params?: Record<string, string>): string {
  if (!params) return `${API_BASE}${path}`;
  const qs = new URLSearchParams(params).toString();
  return `${API_BASE}${path}?${qs}`;
}

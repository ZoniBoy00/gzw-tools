import { useEffect, useState } from 'react';
import { fetchVendorStock, type VendorStockRow } from '../lib/api';

export function useLoadoutStock() {
  const [stock, setStock] = useState<VendorStockRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void fetchVendorStock().then(value => { if (!cancelled) { setStock(value); setLoading(false); } })
      .catch(cause => { if (!cancelled) { setError(cause instanceof Error ? cause.message : 'Stock unavailable'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [attempt]);
  const retry = () => { setError(null); setLoading(true); setAttempt(value => value + 1); };
  return { stock, error, loading, retry };
}


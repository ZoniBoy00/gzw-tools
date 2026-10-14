import { useMemo, useState, useEffect } from 'react';
import type { DatasetQuery } from '@zoniboy/gzw-data-client';
import { gzwClient } from '../lib/api';

export function parseDatasetEndpoint(endpoint: string): { datasetName: string; query: DatasetQuery } {
  const separator = endpoint.indexOf('?');
  const datasetName = (separator >= 0 ? endpoint.slice(0, separator) : endpoint).replace(/^\/+|\/+$/g, '');
  const params = new URLSearchParams(separator >= 0 ? endpoint.slice(separator + 1) : '');
  const query: DatasetQuery = {};

  params.forEach((value, key) => {
    if (key === 'all') {
      query.all = value === 'true';
    } else if (key === 'per_page') {
      const perPage = Number(value);
      if (Number.isFinite(perPage) && perPage > 0) query.perPage = perPage;
    } else if (key === 'page' || key === 'limit') {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue) && numericValue > 0) query[key] = numericValue;
    } else {
      query[key] = value;
    }
  });

  return { datasetName, query };
}

export function useApiData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const { datasetName, query } = useMemo(() => parseDatasetEndpoint(endpoint), [endpoint]);

  useEffect(() => {
    if (!datasetName) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    gzwClient.dataset(datasetName).list(query, controller.signal)
      .then((response) => {
        if (cancelled) return;
        setData(response.data as T[]);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!cancelled && !(cause instanceof Error && cause.name === 'AbortError')) {
          setError(cause instanceof Error ? cause.message : 'Failed to load data');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [datasetName, query, reload]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    setReload(value => value + 1);
  };

  return {
    data: datasetName ? data : [],
    loading: datasetName ? loading : false,
    error: datasetName ? error : 'Dataset name is required',
    refetch,
  };
}

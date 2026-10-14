import { describe, expect, it } from 'vitest';
import { parseDatasetEndpoint } from './useApiData';

describe('parseDatasetEndpoint', () => {
  it('extracts a plain dataset name without adding query options', () => {
    expect(parseDatasetEndpoint('/weapons/')).toEqual({ datasetName: 'weapons', query: {} });
  });

  it('maps legacy REST pagination names into SDK query options', () => {
    expect(parseDatasetEndpoint('regions?per_page=100&page=2')).toEqual({
      datasetName: 'regions',
      query: { perPage: 100, page: 2 },
    });
  });

  it('keeps dataset filters and converts all=true to a boolean', () => {
    expect(parseDatasetEndpoint('keys?all=true&type=Keycard')).toEqual({
      datasetName: 'keys',
      query: { all: true, type: 'Keycard' },
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createGzwDataClient, fetchApiRoot, fetchApiStats, fetchBosses, fetchDataVersion, fetchEvidence, fetchGuideArticles, fetchPlateCarriers, fetchRegions, fetchVests, GZW_API_BASE, parsePen, splitParagraphs } from './api';

describe('SDK-backed API client', () => {
  it('uses the injected SDK fetch for version requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => ({
        data: { dataVersion: '2026-10-12T15:45:06Z' },
      }),
    });
    const client = createGzwDataClient(fetchMock);

    await expect(fetchDataVersion(client)).resolves.toBe('2026-10-12T15:45:06Z');
    expect(fetchMock).toHaveBeenCalledWith(
      `${GZW_API_BASE}/version`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('loads API stats and endpoint discovery through SDK methods', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => null },
        json: async () => ({ data: { weapons: { total: 2, sources: ['wiki'] } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => null },
        json: async () => ({ data: { endpoints: ['weapons', 'ammo'] } }),
      });
    const client = createGzwDataClient(fetchMock);

    await expect(fetchApiStats(client)).resolves.toEqual({ weapons: { total: 2, sources: ['wiki'] } });
    await expect(fetchApiRoot(client)).resolves.toEqual({ endpoints: ['weapons', 'ammo'] });
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${GZW_API_BASE}/stats`, expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${GZW_API_BASE}/`, expect.objectContaining({ method: 'GET' }));
  });
});

describe('ammo penetration mapping', () => {
  it('maps classes below the stopping class to penetration', () => {
    const m855 = parsePen('NIJ III+');

    expect(m855['III']).toBe(2);
    expect(m855['III+']).toBe(1);
    expect(m855['III++']).toBe(0);
    expect(m855['IV']).toBe(0);
  });

  it('marks the stopping class as magdump and stronger classes ineffective', () => {
    const m995 = parsePen('NIJ IV');

    expect(m995['III++']).toBe(2);
    expect(m995['IV']).toBe(1);
    expect(m995['IV+']).toBe(0);
  });

  it('returns ineffective results for an explicit no-penetration marker', () => {
    const wolf = parsePen('NIJ 0');

    expect(Object.values(wolf).every((level) => level === 0)).toBe(true);
  });
});

describe('armor API adapters', () => {
  it('maps live plate carrier records including optional protection ratings', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => ({
        data: [
          {
            name: "Buran's Pantsir 2.0",
            id: 'burans-pantsir-2.0',
            protection_rating: 'R3',
            nij_class: 'III++',
            material: 'Ceramic',
            armor_locations: 'Front, Back, Sides',
            grid_size: '3x3',
            weight: '9.600kg',
            sold_by: 'Looting',
            image: 'https://example.test/buran.png',
          },
          {
            name: 'CGPC3 TQS',
            type: 'Plate Carrier',
            protection_rating: 'P3',
            nij_class: 'IIIA',
            material: 'UHMWPE',
            armor_locations: 'Front,Back',
            inventory: '3x3',
            weight: '3.700kg',
            sold_by: 'Handshake R.1',
          },
        ],
      }),
    });
    const client = createGzwDataClient(fetchMock);
    const plateCarriers = await fetchPlateCarriers(client);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/plate_carriers\?all=true$/),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(plateCarriers).toEqual([
      expect.objectContaining({
        name: "Buran's Pantsir 2.0",
        nij: 'III++',
        protectionRating: 'R3',
        material: 'Ceramic',
        plates: 'Front, Back, Sides',
        grid: '3x3',
        weight: 9.6,
        source: 'Looting',
        image: 'https://example.test/buran.png',
      }),
      expect.objectContaining({
        name: 'CGPC3 TQS',
        nij: 'IIIA',
        protectionRating: 'P3',
        grid: '3x3',
        weight: 3.7,
        source: 'Handshake R.1',
      }),
    ]);
  });

  it('retains the added wiki protection rating for vests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => ({
        data: [{
          name: 'Commander (Black)',
          nij_class: 'IIIA',
          protection_rating: 'P3',
          material: 'Aramid',
          plates: 'Front, Back',
        }, {
          name: 'Rating-only vest',
          protection_rating: 'R2',
        }],
      }),
    });
    const client = createGzwDataClient(fetchMock);

    await expect(fetchVests(client)).resolves.toEqual([
      expect.objectContaining({ name: 'Commander (Black)', nij: 'IIIA', protectionRating: 'P3' }),
      expect.objectContaining({ name: 'Rating-only vest', nij: 'N/A', protectionRating: 'R2' }),
    ]);
  });
});

describe('world guide API adapters', () => {
  it('loads regions with tier, local faction, and split LZ callsigns', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => ({
        data: [{
          name: 'Blue Lagoon',
          id: 'blue-lagoon',
          tier: '2',
          locals_type: 'Rebels',
          lz_callsign: 'JULIETT,KILO,NOVEMBER',
          description: 'Tourism center and campground.',
          image: 'https://example.test/blue-lagoon.png',
        }],
      }),
    });
    const client = createGzwDataClient(fetchMock);

    await expect(fetchRegions(client)).resolves.toEqual([{
      name: 'Blue Lagoon',
      id: 'blue-lagoon',
      tier: '2',
      localsType: 'Rebels',
      lzCallsigns: ['JULIETT', 'KILO', 'NOVEMBER'],
      description: 'Tourism center and campground.',
      image: 'https://example.test/blue-lagoon.png',
    }]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/regions\?per_page=100$/),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('loads boss location, faction, and task notes without inventing missing data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => ({
        data: [{
          name: 'Grin',
          id: 'grin',
          full_name: 'Malo "Grin" Luangrath',
          faction: 'Sifa Syndicate',
          location: 'Blue Lagoon',
          image: 'https://example.test/grin.png',
          tasks: 'Grin needs to be killed for Deep Waters task.',
        }, {
          name: 'Viper',
          id: 'viper',
          faction: '???',
          location: 'Pha Lang Airfield',
          tasks: 'Viper needs to be killed for X task.',
        }],
      }),
    });
    const client = createGzwDataClient(fetchMock);

    await expect(fetchBosses(client)).resolves.toEqual([
      {
        name: 'Grin',
        id: 'grin',
        fullName: 'Malo "Grin" Luangrath',
        faction: 'Sifa Syndicate',
        location: 'Blue Lagoon',
        image: 'https://example.test/grin.png',
        tasks: 'Grin needs to be killed for Deep Waters task.',
      },
      {
        name: 'Viper',
        id: 'viper',
        fullName: '',
        faction: '???',
        location: 'Pha Lang Airfield',
        image: undefined,
        tasks: 'Viper needs to be killed for X task.',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/bosses\?per_page=100$/),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('game guide data', () => {
  const okResponse = (data: unknown[]) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => null },
    json: async () => ({ data }),
  });

  it('combines hideout and game system pages and drops empty articles', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse([{ name: 'Hideout', id: 'hideout', content: 'Your workspace.' }]))
      .mockResolvedValueOnce(okResponse([
        { name: 'Experience', id: 'experience', content: 'Levels.', image: 'https://example.test/xp.png' },
        { name: 'Empty', id: 'empty', content: '  ' },
      ]));
    const articles = await fetchGuideArticles(createGzwDataClient(fetchMock));

    expect(articles.map(article => article.id)).toEqual(['hideout', 'experience']);
    expect(articles[1].image).toBe('https://example.test/xp.png');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/hideout\?per_page=100$/), expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/game_systems\?per_page=100$/), expect.anything());
  });

  it('maps evidence records without inventing missing fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([
      { name: 'Laptop', id: 'laptop', weight: '1.2kg', grid_size: '2x2', sell_price: '$5,000' },
      { name: 'Tourist Passport' },
    ]));
    const items = await fetchEvidence(createGzwDataClient(fetchMock));

    expect(items[0]).toEqual({ id: 'laptop', name: 'Laptop', weight: '1.2kg', gridSize: '2x2', sellPrice: '$5,000', image: undefined });
    expect(items[1]).toMatchObject({ id: 'Tourist Passport', weight: '', gridSize: '', sellPrice: '' });
  });

  it('splits flat wiki text into sentence-aligned paragraphs', () => {
    const sentence = 'This is a reasonably long sentence about the hideout and its rooms.';
    const text = Array(12).fill(sentence).join(' ');
    const paragraphs = splitParagraphs(text, 150);

    expect(paragraphs.length).toBeGreaterThan(1);
    expect(paragraphs.every(paragraph => paragraph.endsWith('.'))).toBe(true);
    expect(paragraphs.join(' ')).toBe(text);
    expect(splitParagraphs('   ')).toEqual([]);
  });
});

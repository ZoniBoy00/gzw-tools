import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchBosses, fetchPlateCarriers, fetchRegions, fetchVests, parsePen } from './api';

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('armor API adapters', () => {
  it('maps live plate carrier records including optional protection ratings', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
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
    vi.stubGlobal('fetch', fetchMock);

    const plateCarriers = await fetchPlateCarriers();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/plate_carriers\?all=true$/));
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
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
    }));

    await expect(fetchVests()).resolves.toEqual([
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
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRegions()).resolves.toEqual([{
      name: 'Blue Lagoon',
      id: 'blue-lagoon',
      tier: '2',
      localsType: 'Rebels',
      lzCallsigns: ['JULIETT', 'KILO', 'NOVEMBER'],
      description: 'Tourism center and campground.',
      image: 'https://example.test/blue-lagoon.png',
    }]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/regions\?per_page=100$/));
  });

  it('loads boss location, faction, and task notes without inventing missing data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
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
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchBosses()).resolves.toEqual([
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
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/bosses\?per_page=100$/));
  });
});
